import { Options } from 'tsup';
import { createTsupConfig } from '../index';

/**
 * Preset configuration for CLI packages
 */
export function createCliConfig(
  entry: string[] | Record<string, string> = ['src/cli.ts'],
  additionalOptions: Partial<Options> = {}
): Options {
  return createTsupConfig({
    packageType: 'cli',
    entry,
    tsupOptions: additionalOptions,
  });
}

/**
 * Preset configuration for packages with both library and CLI components
 */
export function createMixedConfig(
  entry: Record<string, string> = { index: 'src/index.ts', cli: 'src/cli.ts' },
  additionalOptions: Partial<Options> = {}
): Options {
  return createTsupConfig({
    packageType: 'mixed',
    entry,
    tsupOptions: additionalOptions,
  });
}
