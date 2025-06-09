import { defineConfig } from 'vitest/config'

if (!process.env.CI) {
  await import('dotenv/config')
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 300000,
    setupFiles: ['./src/test-setup.ts'],
  },
})
