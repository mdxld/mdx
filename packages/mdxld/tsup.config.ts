import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts', 'src/build.ts', 'src/server.ts'],
  format: ['esm'],
  target: 'node16',
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['yaml', 'next-mdx-remote-client', 'schema-dts'],
  noExternal: [],
  dts: false, // Disable TypeScript declaration files to avoid type errors
})
