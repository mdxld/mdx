import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'contentScripts/fileRenderer': 'contentScripts/fileRenderer.ts',
    'contentScripts/monacoIntegration': 'contentScripts/monacoIntegration.ts',
    'utils/fileTypeDetection': 'utils/fileTypeDetection.ts'
  },
  format: ['esm'],
  dts: false,
  clean: true,
  noExternal: ['@mdxui/browser'],
  external: ['chrome'],
  esbuildOptions: (options) => {
    options.resolveExtensions = ['.tsx', '.ts', '.jsx', '.js', '.json']
    return options
  },
})
