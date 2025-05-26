import { MdxDbBase, MdxDbConfig, VeliteData, DocumentContent } from '../../core/lib/index.js'
import { createClient } from '@libsql/client'
import { FilesCollection, EmbeddingsCollection } from './collections.js'
import crypto from 'crypto'

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
   * Build a SQL WHERE clause from Payload CMS where conditions
   */
  private buildWhereClause(where: any): string {
    if (!where || Object.keys(where).length === 0) return ''
    
    const conditions: string[] = []
    
    for (const [field, condition] of Object.entries(where)) {
      if (condition && typeof condition === 'object') {
        for (const [operator, value] of Object.entries(condition)) {
          switch (operator) {
            case 'equals':
              conditions.push(`${field} = ?`)
              break
            case 'contains':
              conditions.push(`${field} LIKE ?`)
              break
            case 'exists':
              conditions.push(value ? `${field} IS NOT NULL` : `${field} IS NULL`)
              break
            default:
              console.warn(`Unsupported operator: ${operator}`)
          }
        }
      } else {
        conditions.push(`${field} = ?`)
      }
    }
    
    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  }
  
  /**
   * Extract arguments from Payload CMS where conditions
   */
  private extractWhereArgs(where: any): any[] {
    if (!where || Object.keys(where).length === 0) return []
    
    const args: any[] = []
    
    for (const [field, condition] of Object.entries(where)) {
      if (condition && typeof condition === 'object') {
        for (const [operator, value] of Object.entries(condition)) {
          switch (operator) {
            case 'equals':
              args.push(value)
              break
            case 'contains':
              args.push(`%${value}%`)
              break
            case 'exists':
              break
            default:
              console.warn(`Unsupported operator: ${operator}`)
          }
        }
      } else {
        args.push(condition)
      }
    }
    
    return args
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

      await this.dbClient.execute(`
        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL,
          collection TEXT NOT NULL,
          frontmatter TEXT NOT NULL,
          mdx TEXT NOT NULL,
          markdown TEXT NOT NULL,
          html TEXT NOT NULL,
          code TEXT NOT NULL,
          UNIQUE(slug, collection)
        )
      `)

      await this.dbClient.execute(`
        CREATE TABLE IF NOT EXISTS embeddings (
          id TEXT PRIMARY KEY,
          fileId TEXT NOT NULL,
          content TEXT NOT NULL,
          chunkType TEXT NOT NULL,
          sectionPath TEXT,
          collection TEXT NOT NULL,
          vector TEXT NOT NULL,
          FOREIGN KEY(fileId) REFERENCES files(id)
        )
      `)

      this.payload = {
        find: async ({ collection, where }: any) => {
          if (collection === 'files') {
            const whereClause = where ? this.buildWhereClause(where) : ''
            const result = await this.dbClient.execute({
              sql: `SELECT * FROM files ${whereClause}`,
              args: this.extractWhereArgs(where)
            })
            return { docs: result.rows || [] }
          } else if (collection === 'embeddings') {
            const whereClause = where ? this.buildWhereClause(where) : ''
            const result = await this.dbClient.execute({
              sql: `SELECT * FROM embeddings ${whereClause}`,
              args: this.extractWhereArgs(where)
            })
            return { docs: result.rows || [] }
          }
          return { docs: [] }
        },
        create: async ({ collection, data }: any) => {
          const id = crypto.randomUUID()
          if (collection === 'files') {
            const { slug, collection: collectionName, frontmatter, mdx, markdown, html, code } = data
            await this.dbClient.execute({
              sql: `
                INSERT INTO files (id, slug, collection, frontmatter, mdx, markdown, html, code)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `,
              args: [
                id, 
                slug, 
                collectionName, 
                JSON.stringify(frontmatter), 
                mdx, 
                markdown, 
                html, 
                code
              ]
            })
          } else if (collection === 'embeddings') {
            const { fileId, content, chunkType, sectionPath, collection: collectionName, vector } = data
            await this.dbClient.execute({
              sql: `
                INSERT INTO embeddings (id, fileId, content, chunkType, sectionPath, collection, vector)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `,
              args: [
                id, 
                fileId, 
                content, 
                chunkType, 
                sectionPath || null, 
                collectionName, 
                JSON.stringify(vector)
              ]
            })
          }
          return { id, ...data }
        },
        update: async ({ collection, id, data }: any) => {
          if (collection === 'files') {
            const { slug, collection: collectionName, frontmatter, mdx, markdown, html, code } = data
            await this.dbClient.execute({
              sql: `
                UPDATE files
                SET slug = ?, collection = ?, frontmatter = ?, mdx = ?, markdown = ?, html = ?, code = ?
                WHERE id = ?
              `,
              args: [
                slug, 
                collectionName, 
                JSON.stringify(frontmatter), 
                mdx, 
                markdown, 
                html, 
                code, 
                id
              ]
            })
          }
          return { id, ...data }
        },
        delete: async ({ collection, id, where }: any) => {
          if (id) {
            await this.dbClient.execute({
              sql: `DELETE FROM ${collection} WHERE id = ?`,
              args: [id]
            })
          } else if (where) {
            const whereClause = this.buildWhereClause(where)
            await this.dbClient.execute({
              sql: `DELETE FROM ${collection} ${whereClause}`,
              args: this.extractWhereArgs(where)
            })
          }
          return true
        },
      }

      this.initialized = true
      console.log('SQLite database initialized successfully')
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

  /**
   * Search for documents using vector similarity
   * @param query Search query
   * @param collectionName Optional collection name to filter results
   * @returns Array of documents sorted by similarity
   */
  async search(query: string, collectionName?: string): Promise<any[]> {
    await this.initialize()

    try {
      const queryEmbedding = await generateEmbedding(query)

      const whereClause = collectionName ? 'WHERE collection = ?' : ''
      const params = collectionName ? [collectionName] : []

      const result = await this.dbClient.execute({
        sql: `
          SELECT e.*, f.slug, f.frontmatter, f.markdown, f.collection
          FROM embeddings e
          JOIN files f ON e.fileId = f.id
          ${whereClause}
        `,
        args: params
      })

      if (!result.rows || result.rows.length === 0) {
        return []
      }

      const scoredResults = result.rows.map((row: any) => {
        const vector = JSON.parse(row.vector)
        const similarity = this.cosineSimilarity(queryEmbedding, vector)
        
        const frontmatter = JSON.parse(row.frontmatter)
        
        return {
          slug: row.slug,
          collection: row.collection,
          content: row.content,
          frontmatter,
          body: row.markdown,
          similarity,
          sectionPath: row.sectionPath,
          chunkType: row.chunkType
        }
      })

      return scoredResults
        .sort((a: { similarity: number }, b: { similarity: number }) => b.similarity - a.similarity)
        .slice(0, 10)
    } catch (error) {
      console.error('Error searching documents:', error)
      throw new Error(`Failed to search documents: ${(error as Error).message}`)
    }
  }
}
