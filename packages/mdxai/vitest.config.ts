import { defineConfig } from 'vitest/config'

try {
  await import('dotenv/config')
} catch (error) {
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 300000,
    setupFiles: ['./src/test-setup.ts'],
  },
})
