import { MdxDbFs } from './mdxdb-fs.js'

export type { VeliteData } from '@mdxdb/core'

export class MdxDb extends MdxDbFs {
  constructor(packageDir: string = '.') {
    super({ packageDir })
  }
}
