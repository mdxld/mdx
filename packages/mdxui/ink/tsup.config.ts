import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli-workflow.ts'],
  format: ['esm', 'cjs'],
  dts: true, // Enable declaration file generation
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
