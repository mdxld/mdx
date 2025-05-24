import { createMixedConfig } from '@repo/tsup-config'
import { defineConfig } from 'tsup'
import { copyPackageJson } from './copyPackageJson.js'

export default defineConfig((options) => {
  const config = createMixedConfig(
    {
      index: 'lib/mdxdb.ts',
      cli: 'cli.ts',
    },
    {
      noExternal: [],
      external: ['fs', 'path', 'os', 'crypto'],
      dts: false, // Disable TypeScript declaration files to avoid rootDir error
    },
  )

  // Add onSuccess hook to copy package.json to dist folder
  config.onSuccess = async () => {
    await copyPackageJson()
  }

  return config
})
