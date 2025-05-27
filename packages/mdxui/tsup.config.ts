import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  external: [
    'react', 
    '@mdxui/core', 
    '@mdxui/ink', 
    '@mdxui/tailwind', 
    '@mdxui/shadcn', 
    '@mdxui/magicui',
    '@mdxui/reveal',
    'react-devtools-core',
    'ink',
    'ink-table',
    'ink-link',
    'ink-syntax-highlight'
  ],
  banner: {
    js: '"use client";',
  },
  noExternal: [],
})
