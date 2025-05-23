import { MdxDbInterface } from './types.js'

/**
 * Lists documents from a collection or all collections
 * @param db The database instance
 * @param collectionName Optional collection name to filter results
 * @param pattern Optional glob pattern to filter results
 */
export function list(db: MdxDbInterface, collectionName?: string, pattern?: string): any[] {
  return db.list(collectionName, pattern)
}

/**
 * Gets a document by ID
 * @param db The database instance
 * @param id Document ID to retrieve
 * @param collectionName Optional collection name to search in
 * @param pattern Optional glob pattern to match against document paths
 */
export function get(db: MdxDbInterface, id: string, collectionName?: string, pattern?: string): any | undefined {
  return db.get(id, collectionName, pattern)
}
