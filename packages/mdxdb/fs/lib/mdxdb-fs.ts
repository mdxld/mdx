import { execFile, spawn, ChildProcess } from 'child_process'
import { promises as fs } from 'fs'
import matter from 'gray-matter'
import util from 'util'
import path from 'path'
import { MdxDbBase, MdxDbConfig, VeliteData, DocumentContent, extractContentPath } from '@mdxdb/core'

const execFilePromise = util.promisify(execFile)

export class MdxDbFs extends MdxDbBase {
  private packageDir: string
  private veliteWatchProcess: ChildProcess | null = null
  protected data: VeliteData | null = null
  declare protected config: MdxDbConfig

  constructor(config: MdxDbConfig = {}) {
    super(config)
    this.packageDir = path.resolve(config.packageDir || '.')
    this.config = config.veliteConfig || config
  }

  private async loadDataFromVeliteOutput(): Promise<VeliteData> {
    console.log('Re-loading data from .velite output directory...')
    const veliteOutputDir = path.join(this.packageDir, '.velite')
    const loadedData: { [key: string]: any[] } = {}

    try {
      const files = await fs.readdir(veliteOutputDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          const collectionName = path.basename(file, '.json')
          if (collectionName === 'index' || collectionName === 'schemas') {
            continue
          }

          const filePath = path.join(veliteOutputDir, file)
          const fileData = await fs.readFile(filePath, 'utf-8')
          loadedData[collectionName] = JSON.parse(fileData)
          console.log(`Loaded collection '${collectionName}' from ${file}`)
        }
      }

      this.data = loadedData
      if (Object.keys(loadedData).length === 0) {
        console.warn('No collections loaded from .velite output.')
      }
      console.log('Successfully re-loaded all discoverable collections from .velite output.')
      return this.data as VeliteData
    } catch (error) {
      console.error('Error re-loading Velite output data:', error)
      this.data = {}
      throw new Error(`Failed to read or parse Velite output: ${(error as Error).message}`)
    }
  }

  async build(): Promise<VeliteData> {
    console.log('Executing "npx velite build" via child_process.execFile...')
    try {
      const { stdout, stderr } = await execFilePromise('npx', ['velite', 'build'], { cwd: this.packageDir })
      console.log('Velite CLI stdout:', stdout)
      if (stderr) {
        console.error('Velite CLI stderr:', stderr)
        if (stderr.toLowerCase().includes('error')) {
          throw new Error(`Velite CLI build failed: ${stderr}`)
        }
      }
      console.log('Velite CLI build command executed successfully.')
    } catch (error) {
      console.error('Error executing Velite CLI:', error)
      throw new Error(`Velite CLI execution failed: ${(error as Error).message}`)
    }

    try {
      this.data = await this.loadDataFromVeliteOutput()
      console.log('Successfully loaded data using loadDataFromVeliteOutput after build.')
      return this.data
    } catch (error) {
      console.error('Error loading Velite output data after build:', error)
      throw error
    }
  }

  async watch(): Promise<void> {
    if (!this.data) {
      await this.build()
    }

    console.warn('Watch mode is currently disabled. Needs to be implemented using Velite CLI watch mode.')
  }

  stopWatch(): void {
    if (this.veliteWatchProcess) {
      console.log('Stopping Velite watch process...')
      this.veliteWatchProcess.kill()
      this.veliteWatchProcess = null
      console.log('Velite watch process stopped.')
    } else {
      console.log('No Velite watch process running.')
    }
  }

  async set(id: string, content: DocumentContent, collectionName: string): Promise<void> {
    if (!collectionName) {
      throw new Error('`collectionName` is required to create or update an entry.')
    }

    if (!this.config.collections || !this.config.collections[collectionName]) {
      throw new Error(`Collection '${collectionName}' not found in Velite configuration.`)
    }

    const collectionConfig = this.config.collections[collectionName]
    const contentPath = extractContentPath(collectionConfig)

    const filename = `${id}.mdx`
    const fullFilePath = path.join(this.packageDir, contentPath, filename)

    console.log(`Creating/updating file: ${fullFilePath}`)

    try {
      await fs.mkdir(path.dirname(fullFilePath), { recursive: true })

      const mdxContent = matter.stringify(content.body, content.frontmatter)

      await fs.writeFile(fullFilePath, mdxContent)
      console.log(`File '${fullFilePath}' created/updated successfully.`)
    } catch (error) {
      console.error(`Error creating/updating file '${fullFilePath}':`, error)
      throw new Error(`Failed to create/update file for entry '${id}' in collection '${collectionName}': ${(error as Error).message}`)
    }
  }

  async delete(id: string, collectionName: string): Promise<boolean> {
    if (!collectionName) {
      throw new Error('`collectionName` is required to delete an entry.')
    }

    if (!this.config.collections || !this.config.collections[collectionName]) {
      throw new Error(`Collection '${collectionName}' not found in Velite configuration.`)
    }

    const collectionConfig = this.config.collections[collectionName]
    const contentPath = extractContentPath(collectionConfig)

    const filename = `${id}.mdx`
    const fullFilePath = path.join(this.packageDir, contentPath, filename)

    console.log(`Attempting to delete file: ${fullFilePath}`)

    try {
      await fs.unlink(fullFilePath)
      console.log(`File '${fullFilePath}' deleted successfully.`)
      return true
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') {
        console.log(`File '${fullFilePath}' not found. Nothing to delete.`)
        return false
      }
      console.error(`Error deleting file '${fullFilePath}':`, error)
      throw new Error(`Failed to delete file for entry '${id}' in collection '${collectionName}': ${(error as Error).message}`)
    }
  }

  async exportDb(targetDir: string): Promise<void> {
    const sourceVeliteDir = path.join(this.packageDir, '.velite')
    const absoluteTargetDir = path.resolve(targetDir)

    console.log(`Exporting .velite content from '${sourceVeliteDir}' to '${absoluteTargetDir}'...`)

    try {
      try {
        await fs.access(sourceVeliteDir)
      } catch (error) {
        throw new Error(`Source .velite directory '${sourceVeliteDir}' does not exist. Run build() first.`)
      }

      await fs.mkdir(absoluteTargetDir, { recursive: true })

      const copyRecursive = async (src: string, dest: string) => {
        const stats = await fs.stat(src)
        if (stats.isDirectory()) {
          await fs.mkdir(dest, { recursive: true })
          const dirents = await fs.readdir(src, { withFileTypes: true })
          for (const dirent of dirents) {
            const srcPath = path.join(src, dirent.name)
            const destPath = path.join(dest, dirent.name)
            await copyRecursive(srcPath, destPath)
          }
        } else {
          await fs.copyFile(src, dest)
          console.log(`Successfully exported to ${dest}`)
        }
      }

      await copyRecursive(sourceVeliteDir, absoluteTargetDir)

      console.log(`Successfully exported all .velite contents to '${absoluteTargetDir}'.`)
    } catch (error) {
      console.error(`Error exporting .velite directory:`, error)
      throw new Error(`Failed to export .velite directory: ${(error as Error).message}`)
    }
  }
}
