import { createLibraryConfig } from '@repo/tsup-config'
import type { Options } from 'tsup'

export default createLibraryConfig(['index.ts', 'card.ts', 'gradient.ts'], {
  external: ['tailwindcss', 'react'],
  dts: false,
  esbuildOptions: (options) => {
    options.resolveExtensions = ['.tsx', '.ts', '.jsx', '.js', '.json']
    return options
  },
}) as Options
