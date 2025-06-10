import { createMixedConfig } from '@repo/tsup-config'

export default createMixedConfig({
  index: 'src/index.ts'
}, {
  external: ['react', 'react-dom', 'ink', 'esbuild']
})
