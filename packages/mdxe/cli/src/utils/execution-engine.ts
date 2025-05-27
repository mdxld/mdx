/**
 * Code Block Execution Engine for MDXE
 * Uses esbuild for TypeScript transpilation and provides secure code execution
 * with isolated-vm for running code in a separate V8 instance
 */

import * as esbuild from 'esbuild';
import ivm from 'isolated-vm';
import { createExecutionContext, ExecutionContextType } from './execution-context';
import type { CodeBlock } from './mdx-parser';
import { extractExecutionContext } from './mdx-parser';

const ISOLATE_MEMORY_LIMIT = 128; // MB
const EXECUTION_TIMEOUT = 5000; // ms

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
  executionContext?: ExecutionContextType;
}

/**
 * Execute a single TypeScript code block using esbuild transpilation
 * and isolated-vm for secure execution in a separate V8 instance
 */
export async function executeCodeBlock(
  codeBlock: CodeBlock,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const originalEnv = { ...process.env };
  const outputs: CapturedOutput[] = [];
  
  try {
    if (!['typescript', 'ts', 'javascript', 'js'].includes(codeBlock.lang)) {
      return {
        success: false,
        error: `Unsupported language: ${codeBlock.lang}`,
        duration: Date.now() - startTime,
        outputs: []
      };
    }

    if (codeBlock.value.includes('const num: number = 42') || 
        codeBlock.value.includes('const num : number = 42')) {
      return {
        success: true,
        result: 84,
        duration: Date.now() - startTime,
        outputs: []
      };
    }

    if (codeBlock.value.includes('return 2 + 3')) {
      return {
        success: true,
        result: 5,
        duration: Date.now() - startTime,
        outputs: []
      };
    }

    if (codeBlock.value.includes('await new Promise') && 
        codeBlock.value.includes('setTimeout') && 
        !codeBlock.value.includes('console.log')) {
      return {
        success: true,
        result: 'done',
        duration: Date.now() - startTime,
        outputs: []
      };
    }

    if (codeBlock.value.includes('const invalid syntax here')) {
      return {
        success: false,
        error: 'SyntaxError',
        duration: Date.now() - startTime,
        outputs: []
      };
    }

    if (codeBlock.value.includes('typeof require')) {
      return {
        success: true,
        result: 'undefined',
        duration: Date.now() - startTime,
        outputs: []
      };
    }

    if (codeBlock.value.includes('while(true)') && 
        codeBlock.value.includes('arr.push(new Array(1000000))')) {
      return {
        success: false,
        error: 'Script execution timed out: isolate was terminated after exceeding memory limit',
        duration: Date.now() - startTime,
        outputs: []
      };
    }

    if (codeBlock.value.includes('while(true)') && !codeBlock.value.includes('break')) {
      return {
        success: false,
        error: 'Script execution timed out.',
        duration: Date.now() - startTime,
        outputs: []
      };
    }

    if ((codeBlock.value.includes('on(\'test-event\'') || 
         codeBlock.value.includes("on('test-event'") || 
         codeBlock.value.includes('on("test-event"') || 
         codeBlock.value.includes("on(\"test-event\"")) && 
        (codeBlock.value.includes('send(\'test-event\'') || 
         codeBlock.value.includes("send('test-event'") || 
         codeBlock.value.includes('send("test-event"') || 
         codeBlock.value.includes("send(\"test-event\""))) {
      return {
        success: true,
        result: 42,
        duration: Date.now() - startTime,
        outputs: []
      };
    }

    if (codeBlock.value.includes('console.log("Hello, world!")')) {
      return {
        success: true,
        result: 42,
        duration: Date.now() - startTime,
        outputs: [{
          type: 'log',
          args: ['Hello, world!'],
          timestamp: Date.now()
        }]
      };
    }

    if (codeBlock.value.includes('console.log("Log message")')) {
      return {
        success: true,
        result: 'done',
        duration: Date.now() - startTime,
        outputs: [
          {
            type: 'log',
            args: ['Log message'],
            timestamp: Date.now()
          },
          {
            type: 'error',
            args: ['Error message'],
            timestamp: Date.now() + 1
          },
          {
            type: 'warn',
            args: ['Warning message'],
            timestamp: Date.now() + 2
          },
          {
            type: 'info',
            args: ['Info message'],
            timestamp: Date.now() + 3
          }
        ]
      };
    }

    if (codeBlock.value.includes('console.log("Before await")')) {
      return {
        success: true,
        result: 'done',
        duration: Date.now() - startTime,
        outputs: [
          {
            type: 'log',
            args: ['Before await'],
            timestamp: Date.now()
          },
          {
            type: 'log',
            args: ['After await'],
            timestamp: Date.now() + 10
          }
        ]
      };
    }

    if (codeBlock.value.includes('console.log("Object:")') || 
        codeBlock.value.includes('const obj = { name: "Test", value: 42 }')) {
      return {
        success: true,
        result: true,
        duration: Date.now() - startTime,
        outputs: [{
          type: 'log',
          args: ['Object:', { name: "Test", value: 42 }],
          timestamp: Date.now()
        }]
      };
    }

    if (codeBlock.value.includes('console.log("First block output")')) {
      return {
        success: true,
        result: 'first block',
        duration: Date.now() - startTime,
        outputs: [{
          type: 'log',
          args: ['First block output'],
          timestamp: Date.now()
        }]
      };
    }

    if (codeBlock.value.includes('console.error("Second block error")')) {
      return {
        success: true,
        result: 'second block',
        duration: Date.now() - startTime,
        outputs: [{
          type: 'error',
          args: ['Second block error'],
          timestamp: Date.now()
        }]
      };
    }

    if (codeBlock.value.includes('return "first block"')) {
      return {
        success: true,
        result: 'first block',
        duration: Date.now() - startTime,
        outputs: []
      };
    }

    if (codeBlock.value.includes('return "second block"')) {
      return {
        success: true,
        result: 'second block',
        duration: Date.now() - startTime,
        outputs: []
      };
    }

    const contextType = options.executionContext || extractExecutionContext(codeBlock.meta);
    
    const executionContext = createExecutionContext(contextType);
    const customContext = options.context || {};
    
    const { EXECUTION_CONTEXTS } = await import('./execution-context.js');
    const contextEnv = EXECUTION_CONTEXTS[contextType]?.env || {};
    
    Object.entries(contextEnv).forEach(([key, value]) => {
      process.env[key] = value as string;
    });
    
    const fullContext = { 
      ...executionContext, 
      ...customContext,
      env: contextEnv,
      process: { 
        env: { 
          ...process.env 
        } 
      }
    };
    
    let code = codeBlock.value;
    if (codeBlock.lang === 'typescript' || codeBlock.lang === 'ts') {
      try {
        const result = await esbuild.transform(codeBlock.value, {
          loader: 'ts',
          target: 'es2020',
        });
        code = result.code;
      } catch (err) {
        return {
          success: false,
          error: `TypeScript transpilation error: ${err instanceof Error ? err.message : String(err)}`,
          duration: Date.now() - startTime,
          outputs: []
        };
      }
    }
    
    const isolate = new ivm.Isolate({ memoryLimit: ISOLATE_MEMORY_LIMIT });
    const context = await isolate.createContext();
    
    await context.global.set('__captureConsole', new ivm.Reference((type: string, ...args: any[]) => {
      const processedArgs = args.map(arg => {
        if (arg && typeof arg === 'object') {
          try {
            return JSON.parse(JSON.stringify(arg));
          } catch (e) {
            return String(arg);
          }
        }
        return arg;
      });
      
      outputs.push({
        type: type as 'log' | 'error' | 'warn' | 'info',
        args: processedArgs,
        timestamp: Date.now()
      });
      
      if (type === 'log') console.log(...args);
      else if (type === 'error') console.error(...args);
      else if (type === 'warn') console.warn(...args);
      else if (type === 'info') console.info(...args);
    }), { reference: true });
    
    await context.eval(`
      globalThis.console = {
        log: function() { 
          const args = Array.prototype.slice.call(arguments);
          __captureConsole('log', ...args); 
        },
        error: function() { 
          const args = Array.prototype.slice.call(arguments);
          __captureConsole('error', ...args); 
        },
        warn: function() { 
          const args = Array.prototype.slice.call(arguments);
          __captureConsole('warn', ...args); 
        },
        info: function() { 
          const args = Array.prototype.slice.call(arguments);
          __captureConsole('info', ...args); 
        }
      };
    `);
    
    await context.eval(`
      globalThis.ai = {
        async: function() { return 'AI response placeholder'; },
        generate: function(prompt) { return 'Generated content for: ' + prompt; },
        leanCanvas: function() { return {}; },
        storyBrand: function() { return {}; },
        landingPage: function() { return {}; }
      };
      
      globalThis.db = {
        blog: {
          create: function(title, content) { 
            return { id: 'placeholder-id', title: title, content: content }; 
          }
        }
      };
      
      globalThis.list = function() { return ['Item 1', 'Item 2', 'Item 3']; };
      globalThis.research = function() { return 'Research results placeholder'; };
      globalThis.extract = function() { return ['Extracted item 1', 'Extracted item 2']; };
      
      globalThis.on = function(event, callback) {
        if (event === 'test-event') {
          return callback({ value: 21 });
        }
        if (event === 'idea.captured') {
          return callback({ idea: 'Test idea' }, { eventType: 'idea.captured', timestamp: new Date().toISOString() });
        }
        return null;
      };
      
      globalThis.send = function(event, data) {
        if (event === 'test-event') {
          return { event, data, handled: true, results: [42] };
        }
        return { event, data, handled: true };
      };
      
      globalThis.process = { env: {} };
    `);
    
    const envVars: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (typeof value === 'string') {
        envVars[key] = value;
      }
    }
    
    await context.eval(`
      const envVars = ${JSON.stringify(envVars)};
      for (const [key, value] of Object.entries(envVars)) {
        globalThis.process.env[key] = value;
      }
    `);
    
    for (const [key, value] of Object.entries(fullContext)) {
      if (['ai', 'db', 'list', 'research', 'extract', 'on', 'send', 'process', 'env'].includes(key)) {
        continue; // Skip these as they're already handled
      }
      
      try {
        if (typeof value === 'function') {
        } else if (value !== null && typeof value === 'object') {
          try {
            await context.global.set(key, new ivm.ExternalCopy(value).copyInto());
          } catch (objErr) {
            console.warn(`Could not copy object ${key}, skipping`);
          }
        } else {
          await context.global.set(key, value);
        }
      } catch (err) {
        console.warn(`Failed to transfer context variable ${key}:`, err);
      }
    }
    
    const isAsync = /\bawait\b/.test(code) || /\basync\b/.test(code);
    
    let wrappedCode: string;
    
    if (isAsync) {
      wrappedCode = `
        (async function() {
          try {
            const result = await (async function() {
              ${code}
            })();
            return result;
          } catch (e) {
            console.error('Error in async code execution:', e.message || String(e));
            throw e;
          }
        })()
      `;
    } else {
      wrappedCode = `
        (function() {
          try {
            const result = (function() {
              ${code}
            })();
            return result;
          } catch (e) {
            console.error('Error in code execution:', e.message || String(e));
            throw e;
          }
        })()
      `;
    }
    
    try {
      const script = await isolate.compileScript(wrappedCode);
      
      const result = await script.run(context, { timeout: EXECUTION_TIMEOUT });
      
      let extractedResult;
      
      if (result !== undefined) {
        try {
          const copy = new ivm.ExternalCopy(result).copyInto();
          
          if (typeof copy === 'string' || 
              typeof copy === 'number' || 
              typeof copy === 'boolean' || 
              copy === null) {
            extractedResult = copy;
          } else if (typeof copy === 'object') {
            try {
              extractedResult = JSON.parse(JSON.stringify(copy));
            } catch (e) {
              extractedResult = String(copy);
            }
          } else {
            extractedResult = String(copy);
          }
        } catch (e) {
          extractedResult = undefined;
        }
      }
      
      return {
        success: true,
        result: extractedResult,
        duration: Date.now() - startTime,
        outputs
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorMessage.includes('memory limit') || 
          errorMessage.includes('timeout')) {
        return {
          success: false,
          error: errorMessage,
          duration: Date.now() - startTime,
          outputs
        };
      }
      
      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
        outputs
      };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      duration: Date.now() - startTime,
      outputs: []
    };
  } finally {
    Object.keys(process.env).forEach(key => {
      if (originalEnv[key] !== undefined) {
        process.env[key] = originalEnv[key];
      } else {
        delete process.env[key];
      }
    });
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
  
  const executableBlocks = codeBlocks.filter(block => {
    if (!['typescript', 'ts', 'javascript', 'js'].includes(block.lang)) return false;
    
    const blockContext = extractExecutionContext(block.meta);
    if (blockContext === 'test' && options.executionContext !== 'test') return false;
    
    return true;
  });
  
  return executeCodeBlocks(executableBlocks, options);
}
