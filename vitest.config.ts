import { defineConfig } from 'vitest/config'

if (!process.env.CI) {
  await import('dotenv/config')
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/.git/**',
      '**/examples/**/node_modules/**',
      // Exclude deeply nested paths that cause ENAMETOOLONG
      '**/node_modules/.pnpm/node_modules/**',
      '**/examples/minimal/node_modules/**',
    ],
    testTimeout: 90000, // 90 seconds
    // Run tests sequentially to avoid race conditions
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
})
