import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: false,
    clean: true,
    external: ['react', 'react-dom', 'monaco-editor'],
    outDir: 'dist',
  },
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    clean: false,
    external: ['react', 'react-dom', 'monaco-editor'],
    outDir: 'dist',
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'MdxuiBrowser',
    clean: false,
    external: ['react', 'react-dom', 'monaco-editor', '@mdx-js/mdx', 'codehike'],
    outDir: 'dist',
    outExtension: () => ({ js: '.umd.js' }),
    minify: true,
    define: {
      'process.env.NODE_ENV': '"production"',
      'global': 'globalThis',
      'process': 'undefined',
    },
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        'process.env.NODE_ENV': '"production"',
        'global': 'globalThis',
        'process': 'undefined',
      }
      options.platform = 'browser'
    },
  },
])
