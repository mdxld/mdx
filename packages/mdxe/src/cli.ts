#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import pastel from 'pastel';
import path from 'node:path';
import fs from 'node:fs/promises';
import pkg from '../package.json' with { type: 'json' };
import { findMdxFiles } from './utils/mdx-parser';
import { findIndexFile, fileExists } from './utils/file-utils';
import { parseFrontmatter } from '@mdxui/ink';
import { MDXApp } from './components/MDXApp';

/**
 * Run the CLI
 */
export async function run() {
  if (process.argv.length <= 2) {
    const indexFile = await findIndexFile(process.cwd());
    
    if (indexFile) {
      console.log(`Found index file: ${path.basename(indexFile)}`);
      try {
        const { waitUntilExit } = render(
          React.createElement(MDXApp, { initialFilePath: indexFile })
        );
        await waitUntilExit();
        return;
      } catch (error) {
        console.error(`Error reading index file: ${error}`);
        process.exit(1);
      }
    } else {
      const { waitUntilExit } = render(
        React.createElement(MDXApp)
      );
      await waitUntilExit();
      return;
    }
  }

  const cli = new pastel({
    name: 'mdxe',
    version: pkg.version,
    description: 'Zero-Config CLI to Execute, Test, & Deploy Markdown & MDX'
  });

  cli.command({
    name: 'test',
    description: 'Run tests embedded in Markdown/MDX files',
    options: {
      watch: {
        type: 'boolean',
        description: 'Watch files for changes',
        alias: 'w'
      }
    },
    handler: async (options: { watch?: boolean }) => {
      console.log('Running tests...');
      const { waitUntilExit } = render(
        React.createElement(MDXApp, { mode: 'test', options })
      );
      await waitUntilExit();
    }
  });

  cli.command({
    name: 'dev',
    description: 'Start a development server',
    handler: () => {
      console.log('Starting development server...');
      const { waitUntilExit } = render(
        React.createElement(MDXApp, { mode: 'dev' })
      );
      return waitUntilExit();
    }
  });

  cli.command({
    name: 'build',
    description: 'Build the project for production',
    handler: () => {
      console.log('Building project...');
      const { waitUntilExit } = render(
        React.createElement(MDXApp, { mode: 'build' })
      );
      return waitUntilExit();
    }
  });

  cli.command({
    name: 'start',
    description: 'Start the production server',
    handler: () => {
      console.log('Starting production server...');
      const { waitUntilExit } = render(
        React.createElement(MDXApp, { mode: 'start' })
      );
      return waitUntilExit();
    }
  });

  cli.command({
    name: 'exec',
    description: 'Execute code blocks in Markdown/MDX files',
    args: {
      files: {
        type: 'string',
        description: 'Files to execute',
        variadic: true,
        optional: true
      }
    },
    handler: (args: { files?: string[] }) => {
      if (args.files && args.files.length > 0) {
        const filePath = path.resolve(process.cwd(), args.files[0]);
        const { waitUntilExit } = render(
          React.createElement(MDXApp, { initialFilePath: filePath, mode: 'exec' })
        );
        return waitUntilExit();
      } else {
        console.log('Please specify a file to execute');
      }
    }
  });

  await cli.run(process.argv.slice(2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}
