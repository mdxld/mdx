import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'
import path from 'path'

// Load .env from the root directory
config({ path: path.resolve(__dirname, '../.env') })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 300000, // 5 minutes for AI API calls
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  },
})
