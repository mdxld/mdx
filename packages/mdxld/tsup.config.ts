import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts', 'src/build.ts', 'src/server.ts'],
  format: ['esm'],
  target: 'node16',
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['yaml', 'next-mdx-remote-client', 'schema-dts', 'acorn', 'vfile'],
  noExternal: [],
  dts: true, // Enable TypeScript declaration files for proper exports
  onSuccess: async () => {
    const { chmod } = await import('node:fs/promises');
    await chmod('./dist/cli.js', 0o755);
    console.log('Made CLI executable');
  }
})
