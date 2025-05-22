import { createCliConfig } from '@repo/tsup-config'

export default createCliConfig(['src/cli.ts'], {
  external: ['react', 'react-dom', 'next', 'commander'],
  noExternal: [],
  dts: false, // Disable TypeScript declaration files to avoid type errors
  format: ['esm'], // Use ESM format only
  treeshake: false, // Disable tree shaking to preserve dynamic imports
  platform: 'node', // Specify node platform to handle built-in modules correctly
  clean: true, // Clean output directory before building
})
