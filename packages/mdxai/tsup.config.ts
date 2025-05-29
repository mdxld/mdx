import { createMixedConfig } from '@repo/tsup-config'

export default createMixedConfig(
  {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
    'functions/code': 'src/functions/code.ts',
  },
  {
    esbuildOptions: (options) => {
      options.jsx = 'automatic'
      return options
    },
    external: ['react', 'react-dom', 'ink', 'p-queue'],
  },
)
