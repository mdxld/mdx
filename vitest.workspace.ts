import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // Root tests
  {
    test: {
      include: ['tests/**/*.test.ts'],
      name: 'tests',
      environment: 'node',
    },
  },
  // Package configurations
  'packages/*/vitest.config.ts',
  'packages/*/*/vitest.config.ts',
  // Exclude examples from workspace to avoid ENAMETOOLONG errors
  {
    test: {
      include: ['examples/**/test/**/*.test.ts', 'examples/**/*.test.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        // Specifically exclude problematic nested paths
        '**/examples/minimal/node_modules/**',
        '**/mdxe-esbuild-example/**',
      ],
      name: 'examples',
      environment: 'node',
    },
  },
]) 