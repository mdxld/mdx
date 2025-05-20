import { Collection, defineConfig as VeliteDefineConfig } from 'velite' // Import Collection type and defineConfig
import { execFile, spawn, ChildProcess } from 'child_process'
import { promises as fs } from 'fs'
import matter from 'gray-matter' // Import gray-matter
const veliteConfig = {} as any // Mock veliteConfig for TypeScript compilation
import util from 'util'
import path from 'path'

export interface VeliteData {
  [key: string]: any[];
}

const execFilePromise = util.promisify(execFile)

export class MdxDb {
  private data: VeliteData | null = null
  private packageDir: string; // Changed: Made flexible
  private veliteWatchProcess: ChildProcess | null = null
  private config: ReturnType<typeof VeliteDefineConfig> // Store the Velite config

  constructor(packageDir: string = '.') { // Changed: Added constructor arg with default
    this.packageDir = path.resolve(packageDir); // Changed: Resolve to absolute path
    this.config = veliteConfig as any // Store the imported config with type assertion
  }

  private async loadDataFromVeliteOutput(): Promise<VeliteData> {
    console.log('Re-loading data from .velite output directory...');
    const veliteOutputDir = path.join(this.packageDir, '.velite');
    const loadedData: { [key: string]: any[] } = {};

    try {
      const files = await fs.readdir(veliteOutputDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const collectionName = path.basename(file, '.json');
          // Skip internal Velite files like 'index.json' or 'schemas.json' if they exist
          // and are not actual collections. For now, assume all .json files are collections.
          // A more robust check might be needed based on Velite's output structure.
          if (collectionName === 'index' || collectionName === 'schemas') { // Example exclusion
            continue;
          }
          
          const filePath = path.join(veliteOutputDir, file);
          const fileData = await fs.readFile(filePath, 'utf-8');
          loadedData[collectionName] = JSON.parse(fileData);
          console.log(`Loaded collection '${collectionName}' from ${file}`);
        }
      }

      this.data = loadedData as any; // Cast to any, VeliteData is an indexed type
      if (Object.keys(loadedData).length === 0) {
        console.warn('No collections loaded from .velite output. The directory might be empty or contain no JSON collection files.');
      }
      console.log('Successfully re-loaded all discoverable collections from .velite output.');
      return this.data as VeliteData;
    } catch (error) {
      console.error('Error re-loading Velite output data:', error);
      this.data = {}; // Clear data on error to avoid serving stale/incomplete data
      throw new Error(`Failed to read or parse Velite output: ${(error as Error).message}`);
    }
  }

  async build(): Promise<VeliteData> {
    console.log('Executing "npx velite build" via child_process.execFile...')
    try {
      // Ensure CWD is the package directory where velite.config.ts and .velite output reside
      const { stdout, stderr } = await execFilePromise('npx', ['velite', 'build'], { cwd: this.packageDir })
      console.log('Velite CLI stdout:', stdout)
      if (stderr) {
        console.error('Velite CLI stderr:', stderr)
        // Check if stderr contains actual errors, as Velite might output warnings here
        if (stderr.toLowerCase().includes('error')) {
            throw new Error(`Velite CLI build failed: ${stderr}`)
        }
      }
      console.log('Velite CLI build command executed successfully.')
    } catch (error) {
      console.error('Error executing Velite CLI:', error)
      throw new Error(`Velite CLI execution failed: ${(error as Error).message}`)
    }

    // After successful CLI build, load the data using the generalized method
    try {
      this.data = await this.loadDataFromVeliteOutput(); // Changed: Use loadDataFromVeliteOutput
      console.log('Successfully loaded data using loadDataFromVeliteOutput after build.');
      return this.data;
    } catch (error) {
      console.error('Error loading Velite output data after build:', error);
      // this.data will be {} or throw, as handled by loadDataFromVeliteOutput
      throw error; // Re-throw the error from loadDataFromVeliteOutput
    }
  }

  async watch(): Promise<void> {
    if (this.veliteWatchProcess) {
      console.log('Velite watch process already running.')
      return
    }

    if (!this.data) {
      await this.build()
    }

    console.log('Starting Velite watch process...')
    const child = spawn('npx', ['velite', 'dev', '--watch'], {
      cwd: this.packageDir,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    this.veliteWatchProcess = child

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      process.stdout.write(text)
      if (text.includes('build finished')) {
        this.loadDataFromVeliteOutput().catch((err) => {
          console.error('Failed to reload data after watch build:', err)
        })
      }
    })

    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk.toString())
    })

    child.on('close', (code) => {
      console.log(`Velite watch process exited with code ${code}`)
      this.veliteWatchProcess = null
    })
  }
  
  /**
   * Stops the watch process if it's running.
   */
  stopWatch(): void {
    if (this.veliteWatchProcess) {
      console.log('Stopping Velite watch process...');
      this.veliteWatchProcess.kill();
      this.veliteWatchProcess = null;
      console.log('Velite watch process stopped.');
    } else {
      console.log('No Velite watch process running.');
    }
  }
  
  /**
   * Creates or updates an MDX file for the given ID and collection name.
   * 
   * @param {string} id The ID (slug) of the entry to create or update
   * @param {any} content The content object with frontmatter and body
   * @param {string} collectionName The name of the collection
   * @returns {Promise<void>} A promise that resolves when the file is created or updated
   * @throws {Error} If collectionName is not provided, or if the collection is not found in Velite config
   */
  async set(id: string, content: { frontmatter: Record<string, any>; body: string }, collectionName: string): Promise<void> {
    if (!collectionName) {
      throw new Error('`collectionName` is required to create or update an entry.');
    }

    if (!this.config.collections || !this.config.collections[collectionName]) {
      throw new Error(`Collection '${collectionName}' not found in Velite configuration.`);
    }

    const collectionConfig = this.config.collections[collectionName] as unknown as Collection;

    if (!collectionConfig.pattern) {
      throw new Error(`Pattern for collection '${collectionName}' is not defined in Velite configuration.`);
    }

    const globPattern = collectionConfig.pattern;
    const basePathParts = typeof globPattern === 'string' ? globPattern.split('/') : globPattern[0].split('/');
    let contentPath = '';
    for (const part of basePathParts) {
      if (part.includes('*') || part.includes('.')) {
        break;
      }
      contentPath = path.join(contentPath, part);
    }

    if (!contentPath) {
      throw new Error(`Could not determine base content path from pattern '${globPattern}' for collection '${collectionName}'.`);
    }

    const filename = `${id}.mdx`; // Assuming .mdx extension
    const fullFilePath = path.join(this.packageDir, contentPath, filename);

    console.log(`Creating/updating file: ${fullFilePath}`);

    try {
      // Ensure the directory exists
      await fs.mkdir(path.dirname(fullFilePath), { recursive: true });

      // Create the MDX content with frontmatter
      const mdxContent = matter.stringify(content.body, content.frontmatter);

      await fs.writeFile(fullFilePath, mdxContent);
      console.log(`File '${fullFilePath}' created/updated successfully.`);
    } catch (error) {
      console.error(`Error creating/updating file '${fullFilePath}':`, error);
      throw new Error(`Failed to create/update file for entry '${id}' in collection '${collectionName}': ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves entries from the in-memory database.
   *
   * @param {string} [collectionName] - Optional. The name of the collection to retrieve.
   *                                    If not provided, all entries from all collections are returned.
   * @returns {any[]} An array of entries. Returns an empty array if the collection
   *                  doesn't exist or if there's no data.
   */
  list(collectionName?: string): any[] {
    if (!this.data) {
      console.warn('No data loaded. Call build() or ensure watch mode has processed data.');
      return [];
    }

    if (collectionName) {
      if (this.data[collectionName]) {
        return this.data[collectionName];
      } else {
        console.warn(`Collection '${collectionName}' not found.`);
        return [];
      }
    } else {
      // Return all entries from all collections
      let allEntries: any[] = [];
      for (const key in this.data) {
        if (Array.isArray(this.data[key])) {
          allEntries = allEntries.concat(this.data[key]);
        }
      }
      return allEntries;
    }
  }

  getData(): VeliteData | null {
    return this.data
  }

  /**
   * Retrieves a single entry by its ID (assumed to be the 'slug' field)
   * from the in-memory database.
   *
   * @param {string} id - The ID (slug) of the entry to retrieve.
   * @param {string} [collectionName] - Optional. The name of the collection to search within.
   *                                    If not provided, all collections are searched.
   * @returns {any | undefined} The found entry object, or undefined if no entry matches the ID.
   */
  get(id: string, collectionName?: string): any | undefined {
    if (!this.data) {
      console.warn('No data loaded. Call build() or ensure watch mode has processed data.');
      return undefined;
    }

    if (collectionName) {
      const collection = this.data[collectionName];
      if (collection && Array.isArray(collection)) {
        return collection.find(entry => entry.slug === id);
      } else {
        console.warn(`Collection '${collectionName}' not found or is not an array.`);
        return undefined;
      }
    } else {
      // Search across all collections
      for (const key in this.data) {
        const collection = this.data[key];
        if (Array.isArray(collection)) {
          const foundEntry = collection.find(entry => entry.slug === id);
          if (foundEntry) {
            return foundEntry;
          }
        }
      }
      return undefined; // Not found in any collection
    }
  }

  // Optional: Add a method to get a specific collection
  getCollection<T extends keyof VeliteData>(name: T): VeliteData[T] | undefined {
    return this.data?.[name]
  }

  /**
   * Deletes an MDX file corresponding to the given ID and collection name.
   * The ID is used as the filename (e.g., `id.mdx`).
   *
   * @param {string} id The ID (slug) of the entry to delete, used as the filename.
   * @param {string} collectionName The name of the collection.
   * @returns {Promise<boolean>} A promise that resolves to true if the file was deleted,
   *                             false if the file did not exist. Rejects on other errors.
   * @throws {Error} If collectionName is not provided, or if the collection is not found in Velite config,
   *                 or if the collection's path pattern is unusable.
   */
  async delete(id: string, collectionName: string): Promise<boolean> {
    if (!collectionName) {
      throw new Error('`collectionName` is required to delete an entry.');
    }

    if (!this.config.collections || !this.config.collections[collectionName]) {
      throw new Error(`Collection '${collectionName}' not found in Velite configuration.`);
    }

    const collectionConfig = this.config.collections[collectionName] as unknown as Collection;

    if (!collectionConfig.pattern) {
      throw new Error(`Pattern for collection '${collectionName}' is not defined in Velite configuration.`);
    }

    const globPattern = collectionConfig.pattern;
    const basePathParts = typeof globPattern === 'string' ? globPattern.split('/') : globPattern[0].split('/');
    let contentPath = '';
    for (const part of basePathParts) {
      if (part.includes('*') || part.includes('.')) {
        break;
      }
      contentPath = path.join(contentPath, part);
    }

    if (!contentPath) {
      throw new Error(`Could not determine base content path from pattern '${globPattern}' for collection '${collectionName}'.`);
    }

    const filename = `${id}.mdx`; // Assuming .mdx extension
    const fullFilePath = path.join(this.packageDir, contentPath, filename);

    console.log(`Attempting to delete file: ${fullFilePath}`);

    try {
      await fs.unlink(fullFilePath);
      console.log(`File '${fullFilePath}' deleted successfully.`);
      // Velite's watch mode (if active) should pick up the change.
      // If not in watch mode, a manual db.build() would be needed by the caller.
      return true;
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') { // File not found
        console.log(`File '${fullFilePath}' not found. Nothing to delete.`);
        return false;
      }
      console.error(`Error deleting file '${fullFilePath}':`, error);
      throw new Error(`Failed to delete file for entry '${id}' in collection '${collectionName}': ${(error as Error).message}`);
    }
  }

  /**
   * Exports the contents of the .velite output directory to a specified target directory.
   *
   * @param {string} targetDir The path to the target directory where .velite contents should be copied.
   * @returns {Promise<void>} A promise that resolves when the export is complete.
   * @throws {Error} If there's an error during the export process.
   */
  async exportDb(targetDir: string): Promise<void> {
    const sourceVeliteDir = path.join(this.packageDir, '.velite');
    const absoluteTargetDir = path.resolve(targetDir);

    console.log(`Exporting .velite content from '${sourceVeliteDir}' to '${absoluteTargetDir}'...`);

    try {
      // Ensure source .velite directory exists
      try {
        await fs.access(sourceVeliteDir);
      } catch (error) {
        throw new Error(`Source .velite directory '${sourceVeliteDir}' does not exist. Run build() first.`);
      }
      
      // Create target directory if it doesn't exist
      await fs.mkdir(absoluteTargetDir, { recursive: true });

      // Recursive copy function
      const copyRecursive = async (src: string, dest: string) => {
        const stats = await fs.stat(src);
        if (stats.isDirectory()) {
          await fs.mkdir(dest, { recursive: true });
          const dirents = await fs.readdir(src, { withFileTypes: true });
          for (const dirent of dirents) {
            const srcPath = path.join(src, dirent.name);
            const destPath = path.join(dest, dirent.name);
            await copyRecursive(srcPath, destPath);
          }
        } else {
          await fs.copyFile(src, dest);
          console.log(`Successfully exported to ${dest}`);
        }
      };

      // Start the recursive copy
      await copyRecursive(sourceVeliteDir, absoluteTargetDir);

      console.log(`Successfully exported all .velite contents to '${absoluteTargetDir}'.`);
    } catch (error) {
      console.error(`Error exporting .velite directory:`, error);
      throw new Error(`Failed to export .velite directory: ${(error as Error).message}`);
    }
  }
}
