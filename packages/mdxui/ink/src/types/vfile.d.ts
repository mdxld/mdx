declare module 'vfile' {
  export class VFile {
    constructor(input: string | { path?: string; value?: string })
    toString(): string
  }
}
