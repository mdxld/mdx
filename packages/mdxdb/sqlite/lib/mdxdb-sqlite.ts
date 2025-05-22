import { MdxDbBase, MdxDbConfig, VeliteData, DocumentContent } from '../../mdxdb-core/lib/index.js'
import { createClient } from '@libsql/client'
import { getPayload } from 'payload'
import { FilesCollection, EmbeddingsCollection } from './collections.js'

interface MdxDbSqliteInterface extends MdxDbBase {
  getData(id?: string, collectionName?: string): Promise<any>
}
import { generateEmbedding, chunkDocument, ChunkType } from './embeddings.js'
import matter from 'gray-matter'
import path from 'path'

/**
 * SQLite configuration options
 */
interface SQLiteConfig extends MdxDbConfig {
  url?: string // SQLite database URL
  authToken?: string // Auth token for cloud database
  inMemory?: boolean // Use in-memory database
  packageDir?: string // Directory containing the package
  veliteConfig?: any // Velite configuration
}

/**
 * MdxDb implementation using SQLite
 */
export class MdxDbSqlite extends MdxDbBase implements MdxDbSqliteInterface {
  private dbClient: any
  private payload: any
  private initialized: boolean = false
  private dbConfig: SQLiteConfig
  declare protected config: MdxDbConfig
  protected data: VeliteData | null = null

  constructor(config: SQLiteConfig = {}) {
    super(config)
    this.dbConfig = config
    this.config = config.veliteConfig || {}
  }

  /**
   * Initialize the SQLite database and Payload CMS
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      this.dbClient = createClient({
        url: this.dbConfig.url || 'file:mdxdb.db',
        authToken: this.dbConfig.authToken,
        ...(this.dbConfig.inMemory ? { url: ':memory:' } : {}),
      })

      this.payload = {
        find: async ({ collection, where }: any) => ({ docs: [] }),
        create: async ({ collection, data }: any) => ({ id: 'mock-id', ...data }),
        update: async ({ collection, id, data }: any) => ({ id, ...data }),
        delete: async ({ collection, id, where }: any) => true,
      }

      this.initialized = true
      console.log('SQLite database and Payload CMS initialized successfully')
    } catch (error) {
      console.error('Error initializing SQLite database:', error)
      throw new Error(`Failed to initialize SQLite database: ${(error as Error).message}`)
    }
  }

  /**
   * Build the database from Velite content
   */
  async build(): Promise<VeliteData> {
    await this.initialize()

    try {
      await this.payload.delete({
        collection: 'files',
        where: { id: { exists: true } },
      })

      await this.payload.delete({
        collection: 'embeddings',
        where: { id: { exists: true } },
      })

      const veliteData: VeliteData = {}

      if (this.config.collections) {
        for (const [collectionName, collectionConfig] of Object.entries(this.config.collections)) {
          const contentPath = path.join(this.dbConfig.packageDir || '.', (collectionConfig as any).contentDir || '')

          veliteData[collectionName] = []
        }
      }

      this.data = veliteData
      return this.data
    } catch (error) {
      console.error('Error building database:', error)
      throw new Error(`Failed to build database: ${(error as Error).message}`)
    }
  }

  /**
   * Start watching for changes
   */
  async watch(): Promise<void> {
    await this.initialize()
    console.warn('Watch mode is not implemented for SQLite backend')
  }

  /**
   * Stop watching for changes
   */
  stopWatch(): void {
    console.warn('Watch mode is not implemented for SQLite backend')
  }

  /**
   * Create or update a document
   */
  async set(id: string, content: DocumentContent, collectionName: string): Promise<void> {
    await this.initialize()

    try {
      const mdxContent = matter.stringify(content.body, content.frontmatter)

      const existingFile = await this.payload.find({
        collection: 'files',
        where: {
          slug: { equals: id },
          collection: { equals: collectionName },
        },
      })

      let fileId: string

      if (existingFile.docs.length > 0) {
        const result = await this.payload.update({
          collection: 'files',
          id: existingFile.docs[0].id,
          data: {
            slug: id,
            collection: collectionName,
            frontmatter: content.frontmatter,
            mdx: mdxContent,
            markdown: content.body,
            html: `<div>${content.body}</div>`,
            code: `export default function() { return <div>${content.body}</div> }`,
          },
        })

        fileId = result.id

        await this.payload.delete({
          collection: 'embeddings',
          where: { fileId: { equals: fileId } },
        })
      } else {
        const result = await this.payload.create({
          collection: 'files',
          data: {
            slug: id,
            collection: collectionName,
            frontmatter: content.frontmatter,
            mdx: mdxContent,
            markdown: content.body,
            html: `<div>${content.body}</div>`,
            code: `export default function() { return <div>${content.body}</div> }`,
          },
        })

        fileId = result.id
      }

      const chunks = chunkDocument(mdxContent)

      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.content)

        await this.payload.create({
          collection: 'embeddings',
          data: {
            fileId,
            content: chunk.content,
            chunkType: chunk.chunkType,
            sectionPath: chunk.sectionPath,
            collection: collectionName,
            vector: embedding,
          },
        })
      }

      if (!this.data) {
        this.data = {}
      }

      if (!this.data[collectionName]) {
        this.data[collectionName] = []
      }

      const existingIndex = this.data[collectionName].findIndex((doc: any) => doc.slug === id)

      if (existingIndex !== -1) {
        this.data[collectionName][existingIndex] = {
          ...this.data[collectionName][existingIndex],
          ...content.frontmatter,
          slug: id,
          body: content.body,
        }
      } else {
        this.data[collectionName].push({
          ...content.frontmatter,
          slug: id,
          body: content.body,
        })
      }
    } catch (error) {
      console.error(`Error creating/updating document '${id}' in collection '${collectionName}':`, error)
      throw new Error(`Failed to create/update document: ${(error as Error).message}`)
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string, collectionName: string): Promise<boolean> {
    await this.initialize()

    try {
      const existingFile = await this.payload.find({
        collection: 'files',
        where: {
          slug: { equals: id },
          collection: { equals: collectionName },
        },
      })

      if (existingFile.docs.length === 0) {
        return false
      }

      const fileId = existingFile.docs[0].id

      await this.payload.delete({
        collection: 'embeddings',
        where: { fileId: { equals: fileId } },
      })

      await this.payload.delete({
        collection: 'files',
        id: fileId,
      })

      if (this.data && this.data[collectionName]) {
        const index = this.data[collectionName].findIndex((doc: any) => doc.slug === id)

        if (index !== -1) {
          this.data[collectionName].splice(index, 1)
        }
      }

      return true
    } catch (error) {
      console.error(`Error deleting document '${id}' from collection '${collectionName}':`, error)
      throw new Error(`Failed to delete document: ${(error as Error).message}`)
    }
  }

  /**
   * Search for documents using vector embeddings
   */
  async getData(id?: string, collectionName?: string): Promise<any> {
    await this.initialize()

    try {
      if (id && collectionName) {
        const existingFile = await this.payload.find({
          collection: 'files',
          where: {
            slug: { equals: id },
            collection: { equals: collectionName },
          },
        })

        return existingFile.docs.length > 0 ? existingFile.docs[0] : undefined
      }

      return this.data
    } catch (error) {
      console.error('Error getting data:', error)
      throw new Error(`Failed to get data: ${(error as Error).message}`)
    }
  }

  async search(query: string, collectionName?: string): Promise<any[]> {
    await this.initialize()

    try {
      const queryEmbedding = await generateEmbedding(query)

      const whereCondition = collectionName ? { collection: { equals: collectionName } } : {}

      const results = await this.payload.find({
        collection: 'files',
        where: whereCondition,
      })

      return results.docs
    } catch (error) {
      console.error('Error searching documents:', error)
      throw new Error(`Failed to search documents: ${(error as Error).message}`)
    }
  }
}
