import { createMixedConfig } from '@repo/tsup-config'

export default createMixedConfig(
  {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
    'functions/code': 'src/functions/code.ts',
    'functions/code-validator-simple': 'src/functions/code-validator-simple.ts',
  },
  {
    esbuildOptions: (options) => {
      options.jsx = 'automatic'
      return options
    },
    external: ['react', 'react-dom', 'ink', 'p-queue'],
  },
)
