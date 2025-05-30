import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['**/*.{test,spec}.{ts,tsx}', '**/test.tsx'],
		globals: true,
	},
});
