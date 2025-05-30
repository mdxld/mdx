import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  external: ['react', '@mdxui/core', '@mdxai', '@mdxui/ink'],
  noExternal: [],
})
