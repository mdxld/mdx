import { MdxDbFs } from './mdxdb-fs.js'
import { list, get, createProxyDb, CollectionInterface } from '@mdxdb/core'

export type { VeliteData, DocumentContent, CollectionInterface } from '@mdxdb/core'
export { list, get }

/**
 * MdxDb with collection-based API support
 * Allows for db.collectionName.method() syntax
 */
export class MdxDb extends MdxDbFs {
  [collectionName: string]: CollectionInterface | any
  
  constructor(packageDir: string = '.') {
    super({ packageDir })
    return createProxyDb(this) as this
  }
}
