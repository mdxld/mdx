import { createCliConfig } from '@repo/tsup-config';

export default createCliConfig(['src/cli.ts'], {
  external: ['react', 'react-dom', 'next', 'commander'],
  noExternal: [],
  dts: false // Disable TypeScript declaration files to avoid type errors
});
