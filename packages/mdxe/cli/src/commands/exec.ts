/**
 * MDXE Exec Command
 * Executes MDX files with code blocks
 */

import { renderMdxCli } from '@mdxui/ink';
import { createExecutionContext } from '../utils/execution-context';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Run the exec command
 * @param filePath Path to the MDX file to execute
 */
export async function runExecCommand(filePath: string) {
  try {
    console.log(`Executing MDX file: ${path.basename(filePath)}`);
    
    try {
      await fs.access(filePath);
    } catch (error) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    
    const executionContext = createExecutionContext();
    
    await renderMdxCli(filePath, {
      scope: executionContext,
      components: {
      }
    });
    
    console.log('MDX execution completed');
  } catch (error) {
    console.error('Error executing MDX file:', error);
    process.exit(1);
  }
}
