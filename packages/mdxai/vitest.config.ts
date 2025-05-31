import 'dotenv/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 300000,
    deps: {
      inline: ['mdxld', 'zod', '@google/genai', '@mendable/firecrawl-js', 'object-hash'],
    },
  },
})
