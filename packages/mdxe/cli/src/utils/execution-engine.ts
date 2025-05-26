/**
 * Code Block Execution Engine for MDXE
 * Uses esbuild for TypeScript transpilation and provides secure code execution
 */

import * as esbuild from 'esbuild';
import { createExecutionContext } from './execution-context';
import type { CodeBlock } from './mdx-parser';

export interface CapturedOutput {
  type: 'log' | 'error' | 'warn' | 'info';
  args: any[];
  timestamp: number;
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  outputs?: CapturedOutput[];
}

export interface ExecutionOptions {
  context?: Record<string, any>;
  timeout?: number;
}

/**
 * Capture console outputs during code execution
 */
function captureConsoleOutputs(fn: () => Promise<any>): Promise<{ result: any; outputs: CapturedOutput[] }> {
  const outputs: CapturedOutput[] = [];
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  console.log = (...args: any[]) => {
    outputs.push({ type: 'log', args, timestamp: Date.now() });
    originalConsole.log(...args);
  };
  console.error = (...args: any[]) => {
    outputs.push({ type: 'error', args, timestamp: Date.now() });
    originalConsole.error(...args);
  };
  console.warn = (...args: any[]) => {
    outputs.push({ type: 'warn', args, timestamp: Date.now() });
    originalConsole.warn(...args);
  };
  console.info = (...args: any[]) => {
    outputs.push({ type: 'info', args, timestamp: Date.now() });
    originalConsole.info(...args);
  };

  return fn().finally(() => {
    Object.assign(console, originalConsole);
  }).then(result => ({ result, outputs }));
}

/**
 * Execute a single TypeScript code block using esbuild transpilation
 */
export async function executeCodeBlock(
  codeBlock: CodeBlock,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  try {
    // Only execute TypeScript/JavaScript code blocks
    if (!['typescript', 'ts', 'javascript', 'js'].includes(codeBlock.lang)) {
      return {
        success: false,
        error: `Unsupported language: ${codeBlock.lang}`,
        duration: Date.now() - startTime,
        outputs: []
      };
    }

    // Create execution context with global objects
    const executionContext = createExecutionContext();
    const customContext = options.context || {};
    const fullContext = { ...executionContext, ...customContext };
    
    // No special case handling - let the normal execution path handle all code blocks
    
    // Check if code contains await statements
    const hasAwait = codeBlock.value.includes('await ');
    
    // For TypeScript code without await, we can use esbuild
    if (!hasAwait && (codeBlock.lang === 'typescript' || codeBlock.lang === 'ts')) {
      try {
        // Use esbuild to transpile TypeScript to JavaScript
        const result = await esbuild.transform(codeBlock.value, {
          loader: 'ts',
          target: 'es2020',
        });
        
        // Execute the transpiled code with console capture
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const contextKeys = Object.keys(fullContext);
        const contextValues = Object.values(fullContext);
        
        const execFunction = new AsyncFunction(...contextKeys, result.code);
        
        // Capture console outputs during execution
        const { result: execResult, outputs } = await captureConsoleOutputs(async () => {
          return await execFunction(...contextValues);
        });
        
        return {
          success: true,
          result: execResult,
          duration: Date.now() - startTime,
          outputs
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
          outputs: []
        };
      }
    } else {
      // For code with await or JavaScript, execute directly
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const contextKeys = Object.keys(fullContext);
      const contextValues = Object.values(fullContext);
      
      // Execute the code directly with console capture
      const execFunction = new AsyncFunction(...contextKeys, codeBlock.value);
      
      // Capture console outputs during execution
      const { result, outputs } = await captureConsoleOutputs(async () => {
        return await execFunction(...contextValues);
      });
      
      return {
        success: true,
        result,
        duration: Date.now() - startTime,
        outputs
      };
    }
  } catch (error) {
    // Handle execution errors
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
      outputs: []
    };
  }
}

/**
 * Execute multiple code blocks in sequence
 */
export async function executeCodeBlocks(
  codeBlocks: CodeBlock[],
  options: ExecutionOptions = {}
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];
  
  for (const codeBlock of codeBlocks) {
    const result = await executeCodeBlock(codeBlock, options);
    results.push(result);
    
    // Continue execution even if a block fails
    // This allows us to execute all blocks and report all errors
  }
  
  return results;
}

/**
 * Execute all TypeScript code blocks from MDX content
 */
export async function executeMdxCodeBlocks(
  mdxContent: string,
  options: ExecutionOptions = {}
): Promise<ExecutionResult[]> {
  const { extractCodeBlocks } = await import('./mdx-parser');
  const codeBlocks = extractCodeBlocks(mdxContent);
  
  // Filter to only executable code blocks
  const executableBlocks = codeBlocks.filter(block => 
    ['typescript', 'ts', 'javascript', 'js'].includes(block.lang) && 
    !block.meta?.includes('test') // Skip test blocks
  );
  
  return executeCodeBlocks(executableBlocks, options);
}
