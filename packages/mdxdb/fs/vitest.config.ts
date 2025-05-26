import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    pool: 'forks', // Use forks instead of threads for better memory isolation
    poolOptions: {
      forks: {
        execArgv: ['--max-old-space-size=8192'], // Increase memory limit to 8GB
      },
    },
    globals: true,
    environment: 'node',
    hookTimeout: 30000, // Increase hook timeout to 30 seconds to match test timeout
  },
})
