import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api.js'
    }
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['monaco-editor']
  }
})
