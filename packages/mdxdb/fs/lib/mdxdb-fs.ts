import { execFile, spawn, ChildProcess } from 'child_process'
import { promises as fs } from 'fs'
import matter from 'gray-matter'
import util from 'util'
import path from 'path'
import micromatch from 'micromatch'
import { MdxDbBase, MdxDbConfig, VeliteData, DocumentContent, extractContentPath, discoverSchemas, SchemaDefinition } from '@mdxdb/core'

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
    console.log('Building MDX database...')
    try {
      const dbFolderPath = path.join(this.packageDir, '.db')
      let discoveredSchemas: SchemaDefinition[] = []

      try {
        discoveredSchemas = await discoverSchemas(dbFolderPath)
        console.log(`Discovered ${discoveredSchemas.length} schema definitions from .db folder`)
      } catch (error) {
        console.warn('Failed to discover schemas from .db folder:', error)
      }

      const enhancedCollections = { ...(this.config.collections || {}) }

      for (const schemaDef of discoveredSchemas) {
        if (!enhancedCollections[schemaDef.collectionName]) {
          enhancedCollections[schemaDef.collectionName] = {
            name: schemaDef.collectionName,
            pattern: `content/${schemaDef.collectionName}/**/*.{md,mdx}`,
            schema: schemaDef.schema,
          }
          console.log(`Added collection '${schemaDef.collectionName}' from schema definition`)
        } else {
          const existingCollection = enhancedCollections[schemaDef.collectionName]
          if (!existingCollection.schema) {
            existingCollection.schema = schemaDef.schema
            console.log(`Enhanced existing collection '${schemaDef.collectionName}' with schema from .db folder`)
          } else {
            console.log(`Skipped schema for '${schemaDef.collectionName}' as it already has a schema defined`)
          }
        }
      }

      const veliteConfigPath = path.join(this.packageDir, 'velite.config.js')

      let shouldDeleteConfig = false
      try {
        await fs.access(veliteConfigPath)
        console.log('velite.config.js already exists, using existing file')
      } catch (error) {
        shouldDeleteConfig = true
        const configContent = `
          import { defineConfig } from 'velite/dist/index.cjs';
          export default defineConfig({
            root: '${this.packageDir}',
            collections: ${JSON.stringify(enhancedCollections)}
          });
        `
        await fs.mkdir(path.dirname(veliteConfigPath), { recursive: true })
        await fs.writeFile(veliteConfigPath, configContent)
      }

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
      } catch (veliteError) {
        console.warn('Velite CLI execution failed, falling back to manual build:', veliteError)

        const outputDir = path.join(this.packageDir, '.velite')
        await fs.mkdir(outputDir, { recursive: true })

        let contentDirs: { dir: string; collection: string }[] = []
        let veliteConfigPath = ''

        try {
          veliteConfigPath = path.join(this.packageDir, 'velite.config.ts')
          await fs.access(veliteConfigPath)

          const configContent = await fs.readFile(veliteConfigPath, 'utf-8')

          const patternMatches = configContent.match(/pattern:\s*['"]([^'"]+)['"]/g)
          if (patternMatches) {
            for (const match of patternMatches) {
              const pattern = match.match(/pattern:\s*['"]([^'"]+)['"]/)?.[1]
              if (pattern) {
                const parts = pattern.split('/')
                if (parts.length > 0) {
                  const dir = parts[0]
                  contentDirs.push({ dir, collection: dir })
                }
              }
            }
          }

          const collectionMatches = configContent.match(/name:\s*['"]([^'"]+)['"]/g)
          if (collectionMatches) {
            for (let i = 0; i < collectionMatches.length; i++) {
              const collectionName = collectionMatches[i].match(/name:\s*['"]([^'"]+)['"]/)?.[1]
              if (collectionName && contentDirs[i]) {
                contentDirs[i].collection = collectionName
              }
            }
          }
        } catch (configError) {
          console.warn('Could not read velite.config.ts, using fallback directories:', configError)
        }

        if (contentDirs.length === 0) {
          contentDirs = [
            { dir: 'content/posts', collection: 'posts' },
            { dir: 'posts', collection: 'posts' },
            { dir: 'articles', collection: 'articles' },
            { dir: 'content/articles', collection: 'articles' },
            { dir: 'content', collection: 'content' },
          ]
        }

        for (const { dir, collection } of contentDirs) {
          const contentDir = path.join(this.packageDir, dir)

          try {
            await fs.access(contentDir)
            console.log(`Found content directory: ${contentDir}`)

            const files = await fs.readdir(contentDir)
            const entries = []

            for (const file of files) {
              if (file.endsWith('.mdx')) {
                const filePath = path.join(contentDir, file)
                const content = await fs.readFile(filePath, 'utf-8')

                const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
                if (match) {
                  const frontmatterText = match[1]
                  const body = match[2]

                  const frontmatter: Record<string, any> = {}
                  frontmatterText.split('\n').forEach((line) => {
                    const [key, ...valueParts] = line.split(':')
                    if (key && valueParts.length) {
                      frontmatter[key.trim()] = valueParts.join(':').trim()
                    }
                  })

                  entries.push({
                    slug: path.basename(file, '.mdx'),
                    ...frontmatter,
                    body,
                  })
                }
              }
            }

            if (entries.length > 0) {
              await fs.writeFile(path.join(outputDir, `${collection}.json`), JSON.stringify(entries))
              console.log(`Successfully built ${collection} collection with ${entries.length} entries`)
            }
          } catch (dirError) {
            console.log(`Directory ${contentDir} not found or not accessible, skipping`)
          }
        }

        try {
          const outputFiles = await fs.readdir(outputDir)
          const jsonFiles = outputFiles.filter((file) => file.endsWith('.json'))

          if (jsonFiles.length === 0) {
            console.log('No content directories found or processed, creating default empty collections')

            const collections = Object.keys(enhancedCollections)
            if (collections.length > 0) {
              for (const collection of collections) {
                await fs.writeFile(path.join(outputDir, `${collection}.json`), '[]')
                console.log(`Created empty collection file for '${collection}'`)
              }
              console.log(`Successfully created ${collections.length} default empty collection files.`)
            } else {
              await fs.writeFile(path.join(outputDir, 'blog.json'), '[]')
              await fs.writeFile(path.join(outputDir, 'posts.json'), '[]')
              console.log('Created default empty blog.json and posts.json collections')
            }
          }

          const finalFiles = await fs.readdir(outputDir)
          const finalJsonFiles = finalFiles.filter((file) => file.endsWith('.json'))

          console.log(`Successfully built database using fallback method. Created ${finalJsonFiles.length} collection files.`)
        } catch (outputError) {
          console.error('Fallback build method failed to create any collection files:', outputError)
          throw new Error('Failed to create any collection files in fallback build method')
        }
      }

      if (shouldDeleteConfig) {
        await fs.unlink(veliteConfigPath).catch(() => {})
      }
    } catch (error) {
      console.error('Error during build process:', error)
      throw new Error(`Build process failed: ${(error as Error).message}`)
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

  async set(id: string, content: DocumentContent, collectionName: string, pattern?: string): Promise<void> {
    if (!collectionName) {
      throw new Error('`collectionName` is required to create or update an entry.')
    }

    if (!this.config.collections || !this.config.collections[collectionName]) {
      throw new Error(`Collection '${collectionName}' not found in Velite configuration.`)
    }

    const collectionConfig = this.config.collections[collectionName]
    const contentPath = extractContentPath(collectionConfig)

    if (!pattern) {
      const filename = `${id}.mdx`
      const fullFilePath = path.join(this.packageDir, contentPath, filename)

      console.log(`Creating/updating file: ${fullFilePath}`)

      try {
        await fs.mkdir(path.dirname(fullFilePath), { recursive: true })
        const mdxContent = matter.stringify(content.body, content.frontmatter)
        await fs.writeFile(fullFilePath, mdxContent)
        console.log(`File '${fullFilePath}' created/updated successfully.`)

        await this.build()
      } catch (error) {
        console.error(`Error creating/updating file '${fullFilePath}':`, error)
        throw new Error(`Failed to create/update file for entry '${id}' in collection '${collectionName}': ${(error as Error).message}`)
      }
      return
    }

    const baseDir = path.join(this.packageDir, contentPath)
    console.log(`Using glob pattern '${pattern}' in directory '${baseDir}'`)

    try {
      const files = await fs.readdir(baseDir)

      const matchingFiles = files.filter((file) => {
        return micromatch.isMatch(file, pattern)
      })

      if (matchingFiles.length === 0) {
        console.log(`No files matched pattern '${pattern}' in '${baseDir}'`)
        const filename = `${id}.mdx`
        const fullFilePath = path.join(baseDir, filename)

        console.log(`Creating new file: ${fullFilePath}`)

        await fs.mkdir(path.dirname(fullFilePath), { recursive: true })
        const mdxContent = matter.stringify(content.body, content.frontmatter)
        await fs.writeFile(fullFilePath, mdxContent)
        console.log(`File '${fullFilePath}' created successfully.`)
      } else {
        for (const file of matchingFiles) {
          const fullFilePath = path.join(baseDir, file)
          console.log(`Updating file: ${fullFilePath}`)

          const mdxContent = matter.stringify(content.body, content.frontmatter)
          await fs.writeFile(fullFilePath, mdxContent)
          console.log(`File '${fullFilePath}' updated successfully.`)
        }
      }

      await this.build()
    } catch (error) {
      console.error(`Error handling glob pattern '${pattern}' in '${baseDir}':`, error)
      throw new Error(`Failed to create/update files with pattern '${pattern}' in collection '${collectionName}': ${(error as Error).message}`)
    }
  }

  async delete(id: string, collectionName: string, pattern?: string): Promise<boolean> {
    if (!collectionName) {
      throw new Error('`collectionName` is required to delete an entry.')
    }

    if (!this.config.collections || !this.config.collections[collectionName]) {
      throw new Error(`Collection '${collectionName}' not found in Velite configuration.`)
    }

    const collectionConfig = this.config.collections[collectionName]
    const contentPath = extractContentPath(collectionConfig)

    if (!pattern) {
      const filename = `${id}.mdx`
      const fullFilePath = path.join(this.packageDir, contentPath, filename)

      console.log(`Attempting to delete file: ${fullFilePath}`)

      try {
        await fs.unlink(fullFilePath)
        console.log(`File '${fullFilePath}' deleted successfully.`)

        await this.build()
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

    const baseDir = path.join(this.packageDir, contentPath)
    console.log(`Using glob pattern '${pattern}' in directory '${baseDir}'`)

    try {
      const files = await fs.readdir(baseDir)

      const matchingFiles = files.filter((file) => {
        return micromatch.isMatch(file, pattern)
      })

      if (matchingFiles.length === 0) {
        console.log(`No files matched pattern '${pattern}' in '${baseDir}'`)
        return false
      }

      let deletedCount = 0
      for (const file of matchingFiles) {
        const fullFilePath = path.join(baseDir, file)
        console.log(`Deleting file: ${fullFilePath}`)

        try {
          await fs.unlink(fullFilePath)
          console.log(`File '${fullFilePath}' deleted successfully.`)
          deletedCount++
        } catch (error) {
          if ((error as { code?: string }).code !== 'ENOENT') {
            console.error(`Error deleting file '${fullFilePath}':`, error)
          }
        }
      }

      if (deletedCount > 0) {
        await this.build()
        return true
      }

      return false
    } catch (error) {
      console.error(`Error handling glob pattern '${pattern}' in '${baseDir}':`, error)
      throw new Error(`Failed to delete files with pattern '${pattern}' in collection '${collectionName}': ${(error as Error).message}`)
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
