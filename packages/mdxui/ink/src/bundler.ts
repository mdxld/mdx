import * as esbuild from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import { getPlugins, MDXPluginOptions } from './mdx-plugins';

/**
 * Options for bundling MDX files
 */
export interface BundleOptions extends MDXPluginOptions {
  /**
   * Input files or globs to bundle
   */
  input: string | string[];
  
  /**
   * Output directory for bundled files
   */
  outDir: string;
  
  /**
   * External packages that should not be bundled
   */
  external?: string[];
  
  /**
   * Working directory for resolving imports
   */
  cwd?: string;
  
  /**
   * Whether to generate source maps
   */
  sourcemap?: boolean;
  
  /**
   * Whether to minify the output
   */
  minify?: boolean;
}

/**
 * Default external packages that should not be bundled
 */
const DEFAULT_EXTERNALS = [
  'react',
  'react-dom',
  'ink',
  'ink-big-text',
  'ink-table',
  'ink-link',
  'ink-syntax-highlight',
  'ink-task-list',
];

/**
 * Bundle MDX files using esbuild
 */
export async function bundleMdx(options: BundleOptions): Promise<void> {
  const {
    input,
    outDir,
    external = DEFAULT_EXTERNALS,
    cwd = process.cwd(),
    sourcemap = true,
    minify = false,
  } = options;
  
  await fs.mkdir(outDir, { recursive: true });
  
  const plugins = getPlugins(options);
  
  const result = await esbuild.build({
    entryPoints: Array.isArray(input) ? input : [input],
    outdir: outDir,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'es2020',
    external,
    sourcemap,
    minify,
    loader: {
      '.md': 'jsx',
      '.mdx': 'jsx',
    },
    plugins: [
      {
        name: 'mdx-plugin',
        setup(build) {
          build.onLoad({ filter: /\.(md|mdx)$/ }, async (args) => {
            const content = await fs.readFile(args.path, 'utf8');
            
            
            return {
              contents: `
                import React from 'react';
                import { MDXProvider } from '@mdx-js/react';
                import { defaultComponents } from '@mdxui/ink';
                
                
                export default function MDXContent(props) {
                  return (
                    <MDXProvider components={defaultComponents}>
                      <div {...props}>
                        {/* Compiled MDX would go here */}
                        <p>Compiled MDX from: ${path.basename(args.path)}</p>
                      </div>
                    </MDXProvider>
                  );
                }
              `,
              loader: 'jsx',
            };
          });
        },
      },
    ],
  });
  
  return;
}

/**
 * Transform MDX content in memory using esbuild
 */
export async function transformMdx(
  content: string,
  options: MDXPluginOptions = {}
): Promise<string> {
  const plugins = getPlugins(options);
  
  
  const result = await esbuild.transform(content, {
    loader: 'jsx',
    format: 'esm',
    target: 'es2020',
  });
  
  return result.code;
}
