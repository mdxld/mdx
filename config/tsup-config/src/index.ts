import { Options } from 'tsup';

export type PackageType = 'library' | 'cli' | 'mixed';

export interface TsupConfigOptions {
  /**
   * Package type that determines build configuration
   * - 'library': Standard library package
   * - 'cli': CLI package with executable files
   * - 'mixed': Package with both library and CLI components
   */
  packageType?: PackageType;
  /**
   * Entry points for the package
   * Can be an array of paths or an object mapping names to paths
   */
  entry?: string[] | Record<string, string>;
  /**
   * Output directory
   * @default "dist"
   */
  outDir?: string;
  /**
   * Format of the output files
   * @default ["esm"]
   */
  format?: Array<'esm' | 'cjs' | 'iife'>;
  /**
   * Additional tsup options to override defaults
   */
  tsupOptions?: Partial<Options>;
}

/**
 * Creates a tsup configuration based on the provided options
 */
export function createTsupConfig(options: TsupConfigOptions = {}): Options {
  const {
    packageType = 'library',
    entry = ['src/index.ts'],
    outDir = 'dist',
    format = ['esm'],
    tsupOptions = {},
  } = options;

  const baseConfig: Options = {
    entry: Array.isArray(entry) ? entry : Object.values(entry),
    outDir,
    format,
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: true,
    ...tsupOptions,
  };

  if (packageType === 'cli' || packageType === 'mixed') {
    baseConfig.banner = {
      js: "#!/usr/bin/env node",
    };
    baseConfig.noExternal = ['*'];
  }

  if (!Array.isArray(entry)) {
    baseConfig.entry = entry;
  }

  return baseConfig;
}

export * from './presets/library';
export * from './presets/cli';
