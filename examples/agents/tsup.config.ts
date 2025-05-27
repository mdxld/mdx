import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/reactInkChatCli.tsx', 'src/simpleCliDemo.tsx'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  banner: ({ format }) => {
    if (format === 'esm') {
      return {
        js: '#!/usr/bin/env node',
      }
    }
    return {}
  },
})
