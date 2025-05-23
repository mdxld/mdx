import { MdxDbFs } from './mdxdb-fs.js'
import { list, get } from '@mdxdb/core'

export type { VeliteData, DocumentContent } from '@mdxdb/core'
export { list, get }

export class MdxDb extends MdxDbFs {
  constructor(packageDir: string = '.') {
    super({ packageDir })
  }
}
