#!/usr/bin/env node
import React from 'react';
import { render, Box, Text } from 'ink';
import { Command } from 'pastel';
import path from 'node:path';
import fs from 'node:fs/promises';
import pkg from '../package.json' with { type: 'json' };
import { findMdxFiles } from './utils/mdx-parser';
import { findIndexFile } from './utils/file-utils';

const App = () => {
  return (
    <Box>
      <Text>MDXE - Markdown/MDX Execution Engine</Text>
    </Box>
  );
};

/**
 * Run the CLI
 */
export async function run() {
  if (process.argv.length <= 2) {
    const indexFile = await findIndexFile(process.cwd());
    
    if (indexFile) {
      console.log(`Found index file: ${path.basename(indexFile)}`);
      try {
        render(<App />);
        return;
      } catch (error) {
        console.error(`Error reading index file: ${error}`);
        process.exit(1);
      }
    } else {
      render(<App />);
      return;
    }
  }

  const cli = new Command({
    name: 'mdxe',
    version: pkg.version,
    description: 'Zero-Config CLI to Execute, Test, & Deploy Markdown & MDX'
  });

  cli.command({
    name: 'test',
    description: 'Run tests embedded in Markdown/MDX files',
    handler: () => {
      console.log('test command not implemented yet');
    }
  });

  cli.command({
    name: 'dev',
    description: 'Start a development server',
    handler: () => {
      console.log('dev command not implemented yet');
    }
  });

  cli.command({
    name: 'build',
    description: 'Build the project for production',
    handler: () => {
      console.log('build command not implemented yet');
    }
  });

  cli.command({
    name: 'start',
    description: 'Start the production server',
    handler: () => {
      console.log('start command not implemented yet');
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
    handler: (args) => {
      if (args.files && args.files.length > 0) {
        const filePath = path.resolve(process.cwd(), args.files[0]);
        render(<App />);
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
