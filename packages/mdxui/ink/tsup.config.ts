import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts', 
    'src/cli-workflow.ts',
    'src/frontmatter.ts',
    'src/workflow.ts',
    'src/types.ts',
    'src/render.ts',
    'src/markdown.tsx',
    'src/ascii.tsx',
    'src/slides.tsx',
    'src/slide.tsx',
    'src/components.tsx',
    'src/LandingPage.tsx',
    'src/icons.ts'
  ],
  format: ['esm'], // Only use ESM format since ink is ESM-only
  dts: true, // Enable declaration file generation
  splitting: false,
  sourcemap: true,
  clean: true, // Clean output directory before build
  external: ['react', 'react-dom', 'ink', 'ink-big-text', 'figlet'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
  skipNodeModulesBundle: true,
  noExternal: [],
})
