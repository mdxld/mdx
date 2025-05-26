/**
 * MDXE Exec Command
 * Executes MDX files with code blocks
 */

import { createExecutionContext } from '../utils/execution-context';
import fs from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { render, Text, Box } from 'ink';

/**
 * Extract and execute code blocks from MDX content
 */
async function executeCodeBlocks(content: string, executionContext: Record<string, any>) {
  // Simple regex to extract TypeScript code blocks
  const codeBlockRegex = /```typescript\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const codeBlock = match[1];
    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const contextKeys = Object.keys(executionContext);
      const contextValues = Object.values(executionContext);
      
      const execFunction = new AsyncFunction(...contextKeys, codeBlock);
      await execFunction(...contextValues);
    } catch (error) {
      console.error('Error executing code block:', error);
    }
  }
}

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
    
    const content = await fs.readFile(filePath, 'utf-8');
    
    const executionContext = createExecutionContext();
    
    await executeCodeBlocks(content, executionContext);
    
    const { waitUntilExit } = render(
      <Box flexDirection="column" padding={1}>
        <Text bold color="green">MDX Execution Complete</Text>
        <Text>Code blocks have been executed.</Text>
      </Box>
    );
    
    await waitUntilExit();
    console.log('MDX execution completed');
  } catch (error) {
    console.error('Error executing MDX file:', error);
    process.exit(1);
  }
}
