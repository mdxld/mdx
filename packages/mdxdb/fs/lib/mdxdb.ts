import { MdxDbFs } from './mdxdb-fs.js'

export { VeliteData } from '@mdxdb/core'

export class MdxDb extends MdxDbFs {
  constructor(packageDir: string = '.') {
    super({ packageDir })
  }
}
