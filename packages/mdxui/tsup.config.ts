import { createLibraryConfig } from '@repo/tsup-config'
import type { Options } from 'tsup'

export default createLibraryConfig(['index.ts', 'card.ts', 'gradient.ts'], {
  external: ['tailwindcss', 'react'],
}) as Options
