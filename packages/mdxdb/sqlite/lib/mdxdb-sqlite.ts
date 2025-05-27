import { MdxDbBase, MdxDbConfig, VeliteData, DocumentContent } from '../../core/lib/index.js'
import { FilesCollection, EmbeddingsCollection } from './collections.js'
import { generateEmbedding, chunkDocument, ChunkType } from './embeddings.js'
import { getPayloadClient } from './payload.config.js'
import { Payload } from 'payload'
import matter from 'gray-matter'
import path from 'path'

interface MdxDbSqliteInterface extends MdxDbBase {
  getData(id?: string, collectionName?: string): Promise<any>
}

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
 * MdxDb implementation using SQLite with Payload CMS
 */
export class MdxDbSqlite extends MdxDbBase implements MdxDbSqliteInterface {
  private payload: Payload | null = null
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
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
    return dotProduct / (magnitudeA * magnitudeB)
  }

  /**
   * Initialize Payload CMS with SQLite adapter
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Set environment variables for Payload configuration
      if (this.dbConfig.url) {
        process.env.DATABASE_URL = this.dbConfig.url
      }

      if (this.dbConfig.authToken) {
        process.env.DATABASE_AUTH_TOKEN = this.dbConfig.authToken
      }

      if (this.dbConfig.inMemory) {
        process.env.DATABASE_URL = ':memory:'
      }

      this.payload = await getPayloadClient()

      this.initialized = true
      console.log('Payload CMS with SQLite adapter initialized successfully')
    } catch (error) {
      console.error('Error initializing Payload CMS:', error)
      throw new Error(`Failed to initialize Payload CMS: ${(error as Error).message}`)
    }
  }

  /**
   * Build the database from Velite content
   */
  async build(): Promise<VeliteData> {
    await this.initialize()

    try {
      if (this.payload) {
        await this.payload.delete({
          collection: 'files',
          where: { id: { exists: true } },
        })

        await this.payload.delete({
          collection: 'embeddings',
          where: { id: { exists: true } },
        })
      }

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

    if (!this.payload) {
      throw new Error('Payload not initialized')
    }

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
          id: existingFile.docs[0].id as string,
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

        fileId = result.id as string

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

        fileId = result.id as string
      }

      // Generate and store embeddings
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

    if (!this.payload) {
      throw new Error('Payload not initialized')
    }

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

      const fileId = existingFile.docs[0].id as string

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
   * Get data from the database
   */
  async getData(id?: string, collectionName?: string): Promise<any> {
    await this.initialize()

    if (!this.payload) {
      throw new Error('Payload not initialized')
    }

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

  /**
   * Search for documents using vector similarity
   * @param query Search query
   * @param collectionName Optional collection name to filter results
   * @returns Array of documents sorted by similarity
   */
  async search(query: string, collectionName?: string): Promise<any[]> {
    await this.initialize()

    if (!this.payload) {
      throw new Error('Payload not initialized')
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query)

      const whereCondition = collectionName ? { collection: { equals: collectionName } } : undefined

      const embeddingsResult = await this.payload.find({
        collection: 'embeddings',
        where: whereCondition,
        limit: 1000, // Reasonable limit for similarity calculation
      })

      if (!embeddingsResult.docs || embeddingsResult.docs.length === 0) {
        return []
      }

      const scoredResults = embeddingsResult.docs.map((embedding: any) => {
        const vector = embedding.vector
        const similarity = this.cosineSimilarity(queryEmbedding, vector)

        return {
          ...embedding,
          similarity,
        }
      })

      const topResults = scoredResults.sort((a, b) => b.similarity - a.similarity).slice(0, 10)

      const results = []

      for (const result of topResults) {
        const file = await this.payload.findByID({
          collection: 'files',
          id: result.fileId,
        })

        if (file) {
          results.push({
            slug: file.slug,
            collection: file.collection,
            content: result.content,
            frontmatter: file.frontmatter,
            body: file.markdown,
            similarity: result.similarity,
            sectionPath: result.sectionPath,
            chunkType: result.chunkType,
          })
        }
      }

      return results
    } catch (error) {
      console.error('Error searching documents:', error)
      throw new Error(`Failed to search documents: ${(error as Error).message}`)
    }
  }
}
