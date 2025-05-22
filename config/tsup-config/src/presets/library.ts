import { Options } from 'tsup'
import { createTsupConfig } from '../index'

/**
 * Preset configuration for standard library packages
 */
export function createLibraryConfig(entry: string[] | Record<string, string> = ['src/index.ts'], additionalOptions: Partial<Options> = {}): Options {
  return createTsupConfig({
    packageType: 'library',
    entry,
    tsupOptions: additionalOptions,
  })
}
