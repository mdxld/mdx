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

/**
 * Run the exec command
 * @param filePath Path to the MDX file to execute
 * @param contextType Optional execution context type
 */
export async function runExecCommand(filePath: string, contextType?: ExecutionContextType) {
  try {
    const execContext = contextType || 'default';
    console.log(`Executing MDX file: ${path.basename(filePath)} in ${execContext} context`);
    
    try {
      await fs.access(filePath);
    } catch (error) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    
    // Read MDX content
    const content = await fs.readFile(filePath, 'utf-8');
    
    const results = await executeMdxCodeBlocks(content, { 
      executionContext: execContext 
    });
    
    const { waitUntilExit } = render(
      <Box flexDirection="column" padding={1}>
        <Text bold color="green">MDX Execution Complete</Text>
        <Text>Executed {results.length} code block(s)</Text>
        
        {results.map((result, index) => (
          <Box key={index} marginTop={1} flexDirection="column">
            <Text>
              Block {index + 1}: {result.success ? 
                <Text color="green">✓ Success</Text> : 
                <Text color="red">✗ Failed</Text>
              }
            </Text>
            {result.error && (
              <Text color="red">Error: {result.error}</Text>
            )}
            {result.result !== undefined && (
              <Text>Result: {JSON.stringify(result.result)}</Text>
            )}
            {result.outputs && result.outputs.length > 0 && (
              <Box flexDirection="column" marginTop={1}>
                <Text bold>Console Outputs:</Text>
                {result.outputs.map((output, outputIndex) => (
                  <Text key={outputIndex} color={
                    output.type === 'error' ? 'red' : 
                    output.type === 'warn' ? 'yellow' : 
                    output.type === 'info' ? 'blue' : 
                    'white'
                  }>
                    {output.type}: {output.args.map(arg => 
                      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                    ).join(' ')}
                  </Text>
                ))}
              </Box>
            )}
            <Text dimColor>Duration: {result.duration}ms</Text>
          </Box>
        ))}
      </Box>
    );
    
    await waitUntilExit();
    
    const failedBlocks = results.filter(r => !r.success);
    if (failedBlocks.length > 0) {
      console.log(`${failedBlocks.length} code block(s) failed`);
      process.exit(1);
    }
    
    console.log('MDX execution completed successfully');
  } catch (error) {
    console.error('Error executing MDX file:', error);
    process.exit(1);
  }
}
