import { Collection } from 'velite'

/**
 * Generic interface for MDX document data
 */
export interface DocumentData {
  [key: string]: any
}

/**
 * Interface for storing collections of documents
 */
export interface VeliteData {
  [key: string]: any[]
}

/**
 * Document content with frontmatter and body
 */
export interface DocumentContent {
  frontmatter: Record<string, any>
  body: string
}

/**
 * Interface for collection operations
 */
export interface CollectionInterface {
  /**
   * Create a new document in this collection
   */
  create(title: string, content: string): Promise<void>

  /**
   * Get a document by ID from this collection
   */
  get(id: string): any | undefined

  /**
   * List all documents in this collection
   */
  list(): any[]

  /**
   * Update an existing document in this collection
   */
  update(id: string, title: string, content: string): Promise<void>

  /**
   * Delete a document from this collection
   */
  delete(id: string): Promise<boolean>
}

/**
 * Interface for database operations
 */
export interface MdxDbInterface {
  /**
   * Builds or rebuilds the database
   */
  build(): Promise<VeliteData>

  /**
   * Starts watching for changes
   */
  watch(): Promise<void>

  /**
   * Stops watching for changes
   */
  stopWatch(): void

  /**
   * Creates or updates a document
   * @param id Document ID to create or update
   * @param content Document content to write
   * @param collectionName Collection name to create or update in
   * @param pattern Optional glob pattern to match files to update
   */
  set(id: string, content: DocumentContent, collectionName: string, pattern?: string): Promise<void>

  /**
   * Lists documents from a collection or all collections
   * @param collectionName Optional collection name to filter results
   * @param pattern Optional glob pattern to filter results
   */
  list(collectionName?: string, pattern?: string): any[]

  /**
   * Gets the current database data
   */
  getData(): VeliteData | null

  /**
   * Gets a document by ID
   * @param id Document ID to retrieve
   * @param collectionName Optional collection name to search in
   * @param pattern Optional glob pattern to match against document paths
   */
  get(id: string, collectionName?: string, pattern?: string): any | undefined

  /**
   * Gets all documents from a collection
   */
  getCollection<T extends keyof VeliteData>(name: T): VeliteData[T] | undefined

  /**
   * Deletes a document
   * @param id Document ID to delete
   * @param collectionName Collection name to delete from
   * @param pattern Optional glob pattern to match files to delete
   */
  delete(id: string, collectionName: string, pattern?: string): Promise<boolean>

  /**
   * Search for documents using vector embeddings (optional)
   */
  search?(query: string, collectionName?: string): Promise<any[]>

  /**
   * Dynamic collection access
   * This allows for db.collectionName.method() syntax
   */
  [collectionName: string]: CollectionInterface | any
}

/**
 * Configuration for database implementations
 */
export interface MdxDbConfig {
  packageDir?: string
  veliteConfig?: any
  collections?: Record<string, any>
}
