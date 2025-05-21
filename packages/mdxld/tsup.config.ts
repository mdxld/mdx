import { createLibraryConfig } from '@repo/tsup-config';

export default createLibraryConfig(['src/index.ts'], {
  external: ['yaml', 'next-mdx-remote-client', 'schema-dts'],
  noExternal: [],
  dts: false // Disable TypeScript declaration files to avoid type errors
});
