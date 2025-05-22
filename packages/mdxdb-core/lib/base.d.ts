import { MdxDbInterface, MdxDbConfig, VeliteData } from './types.js'
/**
 * Abstract base class for MdxDb implementations
 */
export declare abstract class MdxDbBase implements MdxDbInterface {
  protected data: VeliteData | null
  protected config: MdxDbConfig
  constructor(config?: MdxDbConfig)
  abstract build(): Promise<VeliteData>
  abstract watch(): Promise<void>
  abstract stopWatch(): void
  abstract set(id: string, content: any, collectionName: string): Promise<void>
  abstract delete(id: string, collectionName: string): Promise<boolean>
  /**
   * Lists documents from a collection or all collections
   */
  list(collectionName?: string): any[]
  /**
   * Gets the current database data or a specific document
   */
  getData(id?: string, collectionName?: string): VeliteData | null | any
  /**
   * Gets a document by ID
   */
  get(id: string, collectionName?: string): any | undefined
  /**
   * Gets all documents from a collection
   */
  getCollection<T extends keyof VeliteData>(name: T): VeliteData[T] | undefined
  /**
   * Search for documents using vector embeddings (optional)
   * Default implementation returns empty array
   */
  search(query: string, collectionName?: string): Promise<any[]>
}
