import { createCliConfig } from '@repo/tsup-config'

export default createCliConfig(['src/index.ts', 'src/cli.ts', 'src/server.ts'], {
  external: [
    '@modelcontextprotocol/sdk',
    '@mdxld/core',
    '@mdxui/ink', 
    '@mdxai/core',
    '@mdxdb/core',
    'commander',
    'zod',
    'react',
    'react-dom'
  ],
  noExternal: [],
  dts: false,
  format: ['esm'],
  treeshake: false,
  platform: 'node',
  clean: true,
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.jsxImportSource = 'react'
  },
})
