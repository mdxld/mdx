#!/usr/bin/env node
import { Command } from 'commander';
import { renderMdxCli } from './render';
import { bundleMdx } from './bundler';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';
import * as globModule from 'glob';
const glob = globModule.sync;

const program = new Command();

program
  .name('ink-mdx')
  .description('Render and bundle MDX files for CLI applications')
  .version('0.1.0');

program
  .command('render')
  .description('Render an MDX file in the terminal')
  .argument('<mdxPath>', 'Path to the MDX file to render')
  .option('-s, --scope <scope>', 'Additional scope variables in key=value format')
  .option('-e, --execute', 'Execute code blocks in the MDX file', false)
  .action(async (mdxPath, options) => {
    try {
      const scope: Record<string, string> = {};

      if (options.scope) {
        const scopeItems = Array.isArray(options.scope) ? options.scope : [options.scope];
        scopeItems.forEach((item: string) => {
          const [key, value] = item.split('=');
          if (key && value) {
            scope[key] = value;
          }
        });
      }

      const result = await renderMdxCli(mdxPath, { 
        scope,
        executeCode: options.execute 
      });
      console.log('Rendered successfully with input values:', result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Input validation error:', error.errors);
      } else {
        console.error('Error rendering MDX:', error);
      }
      process.exit(1);
    }
  });

program
  .command('build')
  .description('Bundle MDX files for use in CLI applications')
  .argument('<input>', 'Input files or glob patterns')
  .option('-o, --out-dir <outDir>', 'Output directory', './dist')
  .option('-e, --external <external>', 'External packages to exclude from bundle (comma-separated)')
  .option('-m, --minify', 'Minify the output', false)
  .option('-s, --sourcemap', 'Generate source maps', true)
  .action(async (input, options) => {
    try {
      const files = glob(input);
      
      if (files.length === 0) {
        console.warn(`No files found matching pattern: ${input}`);
        return;
      }
      
      console.log(`Found ${files.length} files to bundle`);
      
      const external = options.external ? options.external.split(',') : undefined;
      
      await bundleMdx({
        input: files,
        outDir: options.outDir,
        external,
        minify: options.minify,
        sourcemap: options.sourcemap,
      });
      
      console.log(`Successfully bundled MDX files to ${options.outDir}`);
    } catch (error) {
      console.error('Error bundling MDX:', error);
      process.exit(1);
    }
  });

program.parse();
