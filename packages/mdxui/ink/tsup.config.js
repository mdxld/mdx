import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'], // Only build ESM since Ink is ESM-only
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  jsx: true,
  cjsInterop: false,
  noExternal: ['ink', 'pastel', 'chalk'],
})
