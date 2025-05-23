import { Collection } from 'velite'
import { MdxDbInterface, MdxDbConfig, VeliteData } from './types.js'
import micromatch from 'micromatch'
import path from 'path'
import { ChildProcess } from 'child_process'
import { buildWithMdxld, watchWithMdxld } from './mdxld.js'

/**
 * Abstract base class for MdxDb implementations
 */
export abstract class MdxDbBase implements MdxDbInterface {
  protected data: VeliteData | null = null
  protected config: MdxDbConfig
  protected mdxldWatchProcess: ChildProcess | null = null

  constructor(config: MdxDbConfig = {}) {
    this.config = config.veliteConfig || ({} as any)
    this.mdxldWatchProcess = null
  }

  abstract build(): Promise<VeliteData>
  abstract watch(): Promise<void>
  abstract stopWatch(): void
  abstract set(id: string, content: any, collectionName: string): Promise<void>
  abstract delete(id: string, collectionName: string): Promise<boolean>

  /**
   * Lists documents from a collection or all collections
   * @param collectionName Optional collection name to filter results
   * @param pattern Optional glob pattern to filter results
   */
  list(collectionName?: string, pattern?: string): any[] {
    if (!this.data) {
      console.warn('No data loaded. Call build() or ensure watch mode has processed data.')
      return []
    }

    let entries: any[] = []

    // Get entries from specified collection or all collections
    if (collectionName) {
      if (this.data[collectionName]) {
        entries = this.data[collectionName]
      } else {
        console.warn(`Collection '${collectionName}' not found.`)
        return []
      }
    } else {
      for (const key in this.data) {
        if (Array.isArray(this.data[key])) {
          entries = entries.concat(this.data[key])
        }
      }
    }

    if (pattern && entries.length > 0) {
      return entries.filter(entry => {
        const matchValue = entry.filePath || 
                         (entry.slug ? `${entry.slug}.mdx` : null) || 
                         '';
        return micromatch.isMatch(matchValue, pattern);
      });
    }

    return entries;
  }

  /**
   * Gets the current database data or a specific document
   */
  getData(id?: string, collectionName?: string): VeliteData | null | any {
    if (id && collectionName) {
      return this.get(id, collectionName)
    } else if (id) {
      return this.get(id)
    }
    return this.data
  }

  /**
   * Gets a document by ID
   * @param id Document ID to retrieve
   * @param collectionName Optional collection name to search in
   * @param pattern Optional glob pattern to match against document paths
   */
  get(id: string, collectionName?: string, pattern?: string): any | undefined {
    if (!this.data) {
      console.warn('No data loaded. Call build() or ensure watch mode has processed data.')
      return undefined
    }

    if (collectionName) {
      const collection = this.data[collectionName]
      if (collection && Array.isArray(collection)) {
        const entry = collection.find((entry) => entry.slug === id)
        
        if (entry && pattern) {
          const matchValue = entry.filePath || 
                           (entry.slug ? `${entry.slug}.mdx` : null) || 
                           '';
          if (!micromatch.isMatch(matchValue, pattern)) {
            return undefined; // Entry doesn't match pattern
          }
        }
        
        return entry;
      } else {
        console.warn(`Collection '${collectionName}' not found or is not an array.`)
        return undefined
      }
    } else {
      // Search across all collections
      for (const key in this.data) {
        const collection = this.data[key]
        if (Array.isArray(collection)) {
          const entry = collection.find((entry) => entry.slug === id)
          if (entry) {
            if (pattern) {
              const matchValue = entry.filePath || 
                               (entry.slug ? `${entry.slug}.mdx` : null) || 
                               '';
              if (!micromatch.isMatch(matchValue, pattern)) {
                continue; // Entry doesn't match pattern, try next collection
              }
            }
            
            return entry;
          }
        }
      }
      return undefined // Not found in any collection
    }
  }

  /**
   * Gets all documents from a collection
   */
  getCollection<T extends keyof VeliteData>(name: T): VeliteData[T] | undefined {
    return this.data?.[name]
  }

  /**
   * Search for documents using vector embeddings (optional)
   * Default implementation returns empty array
   */
  async search(query: string, collectionName?: string): Promise<any[]> {
    console.warn('Search not implemented in this database implementation')
    return []
  }

  /**
   * Builds the database using mdxld
   * This is a helper method that tech-specific implementations can use
   */
  protected async buildWithMdxld(options: {
    sourceDir?: string
    outputDir?: string
    configFile?: string
  }): Promise<any> {
    const result = await buildWithMdxld({
      ...options,
      watch: false
    })
    
    return result
  }
  
  /**
   * Starts watching files using mdxld
   * This is a helper method that tech-specific implementations can use
   */
  protected watchWithMdxld(options: {
    sourceDir?: string
    outputDir?: string
    configFile?: string
  }): void {
    this.stopMdxldWatch()
    
    this.mdxldWatchProcess = watchWithMdxld(options)
  }
  
  /**
   * Stops the mdxld watch process
   */
  protected stopMdxldWatch(): void {
    if (this.mdxldWatchProcess) {
      this.mdxldWatchProcess.kill()
      this.mdxldWatchProcess = null
      console.log('Stopped mdxld watch process')
    }
  }
}
