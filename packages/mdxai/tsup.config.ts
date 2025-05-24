import { createMixedConfig } from '@repo/tsup-config'

export default createMixedConfig(
  {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  {
    esbuildOptions: (options) => {
      options.jsx = 'automatic'
      return options
    },
    external: ['react', 'react-dom', 'ink', 'p-queue'],
  },
)
