/**
 * MDXE Exec Command
 * Executes MDX files with code blocks using esbuild transpilation
 */

import { executeMdxCodeBlocks } from '../utils/execution-engine';
import { ExecutionContextType } from '../utils/execution-context';
import fs from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { render, Text, Box } from 'ink';
import { FileWatcher } from '../utils/file-watcher';

export interface ExecOptions {
  watch?: boolean;
}

/**
 * Run the exec command
 * @param filePath Path to the MDX file to execute
 * @param options Execution options including watch mode
 * @param contextType Optional execution context type
 */
export async function runExecCommand(filePath: string, options: ExecOptions = {}, contextType?: ExecutionContextType) {
  try {
    const execContext = contextType || 'default';
    console.log(`Executing MDX file: ${path.basename(filePath)} in ${execContext} context`);
    
    try {
      await fs.access(filePath);
    } catch (error) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const executeFile = async () => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const results = await executeMdxCodeBlocks(content, { 
          executionContext: execContext as any
        });
        
        console.log(`\n🔄 Execution complete at ${new Date().toLocaleTimeString()}`);
        console.log(`Executed ${results.length} code block(s)`);
        
        const failedBlocks = results.filter(r => !r.success);
        if (failedBlocks.length > 0) {
          console.log(`❌ ${failedBlocks.length} code block(s) failed`);
          failedBlocks.forEach((result, index) => {
            console.log(`  Block ${index + 1}: ${result.error}`);
          });
          process.exit(1);
        } else {
          console.log(`✅ All code blocks executed successfully`);
        }
      } catch (error) {
        console.error('Error executing MDX file:', error);
      }
    };

    await executeFile();

    if (options.watch) {
      const watcher = new FileWatcher(filePath, executeFile, {
        debounceDelay: 300
      });
      
      watcher.start();
      
      process.on('SIGINT', () => {
        console.log('\n👋 Stopping file watcher...');
        watcher.stop();
        process.exit(0);
      });
      
      console.log('Press Ctrl+C to stop watching');
      await new Promise(() => {}); // Keep running indefinitely
    }
  } catch (error) {
    console.error('Error executing MDX file:', error);
    process.exit(1);
  }
}
