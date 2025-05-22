import { createMixedConfig } from '@repo/tsup-config'

export default createMixedConfig(
  {
    index: 'lib/mdxdb.ts',
    cli: 'cli.ts',
  },
  {
    noExternal: [],
    external: ['fs', 'path', 'os', 'crypto'],
    dts: false, // Disable TypeScript declaration files to avoid rootDir error
  },
)
