import { createTsupConfig } from '@repo/tsup-config'

export default createTsupConfig({
  packageType: 'library',
  entry: ['src/index.ts'],
  format: ['esm']
})
