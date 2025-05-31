import 'dotenv/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 300000,
    env: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      AI_GATEWAY_TOKEN: process.env.AI_GATEWAY_TOKEN,
      AI_GATEWAY_URL: process.env.AI_GATEWAY_URL,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    },
  },
})
