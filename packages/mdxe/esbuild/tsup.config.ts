import { createLibraryConfig } from '@repo/tsup-config'

export default createLibraryConfig(['src/index.ts'], {
  external: ['react', 'react-dom', 'esbuild', '@mdx-js/esbuild', 'remark-frontmatter', 'remark-mdx-frontmatter', 'remark-gfm', 'fast-glob'],
  noExternal: [],
  dts: true, // Generate TypeScript declaration files
  format: ['esm'], // Use ESM format only
  clean: true, // Clean output directory before building
})
