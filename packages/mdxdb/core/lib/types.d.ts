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
   */
  set(id: string, content: DocumentContent, collectionName: string): Promise<void>
  /**
   * Lists documents from a collection or all collections
   */
  list(collectionName?: string): any[]
  /**
   * Gets the current database data
   */
  getData(): VeliteData | null
  /**
   * Gets a document by ID
   */
  get(id: string, collectionName?: string): any | undefined
  /**
   * Gets all documents from a collection
   */
  getCollection<T extends keyof VeliteData>(name: T): VeliteData[T] | undefined
  /**
   * Deletes a document
   */
  delete(id: string, collectionName: string): Promise<boolean>
  /**
   * Search for documents using vector embeddings (optional)
   */
  search?(query: string, collectionName?: string): Promise<any[]>
}
/**
 * Configuration for database implementations
 */
export interface MdxDbConfig {
  packageDir?: string
  veliteConfig?: any
  collections?: Record<string, any>
}
