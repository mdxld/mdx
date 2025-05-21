import { createCliConfig } from '@repo/tsup-config';

export default createCliConfig(['src/cli.ts'], {
  external: ['react', 'react-dom', 'next', 'commander', 'os', 'path', 'fs', 'util', 'child_process', 'url'],
  noExternal: [],
  dts: false, // Disable TypeScript declaration files to avoid type errors
  format: ['cjs'] // Use CommonJS format to avoid ESM dynamic import issues
});
