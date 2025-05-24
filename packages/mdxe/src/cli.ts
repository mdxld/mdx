#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import path from 'node:path';
import fs from 'node:fs/promises';
import pkg from '../package.json' with { type: 'json' };
import { findMdxFiles } from './utils/mdx-parser';
import { findIndexFile, fileExists } from './utils/file-utils';
import { parseFrontmatter } from '@mdxui/ink';
import { CLIApp } from './components/CLIApp';

/**
 * Run the CLI
 */
export async function run() {
  const args = process.argv.slice(2);
  let mode: 'default' | 'test' | 'dev' | 'build' | 'start' | 'exec' = 'default';
  let filePath: string | undefined;
  let options: Record<string, any> = {};
  
  if (args.length > 0) {
    const command = args[0];
    
    switch (command) {
      case 'test':
        mode = 'test';
        options.watch = args.includes('--watch') || args.includes('-w');
        break;
      case 'dev':
        mode = 'dev';
        break;
      case 'build':
        mode = 'build';
        break;
      case 'start':
        mode = 'start';
        break;
      case 'exec':
        mode = 'exec';
        if (args.length > 1) {
          filePath = path.resolve(process.cwd(), args[1]);
        }
        break;
      default:
        filePath = path.resolve(process.cwd(), command);
        break;
    }
  }
  
  try {
    const { waitUntilExit } = render(
      React.createElement(CLIApp, {
        initialFilePath: filePath,
        mode,
        options
      })
    );
    
    await waitUntilExit();
  } catch (error) {
    console.error('Error running CLI:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}
