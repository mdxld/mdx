import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli-workflow.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Temporarily disable dts generation
  splitting: false,
  sourcemap: true,
  clean: false, // Don't clean to preserve manually generated declaration files
  external: ['react', 'react-dom', 'ink'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
  skipNodeModulesBundle: true,
  noExternal: [],
})
