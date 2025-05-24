import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts', 
    'src/cli-workflow.ts',
    'src/frontmatter.ts',
    'src/workflow.ts',
    'src/types.ts',
    'src/render.ts'
  ],
  format: ['esm', 'cjs'],
  dts: false, // Temporarily disable declaration file generation to fix CI
  splitting: false,
  sourcemap: true,
  clean: true, // Clean output directory before build
  external: ['react', 'react-dom', 'ink'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
  skipNodeModulesBundle: true,
  noExternal: [],
})
