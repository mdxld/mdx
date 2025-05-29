import * as esbuild from 'esbuild'
import * as fs from 'fs/promises'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Represents a code block extracted from MDX content
 */
export interface CodeBlock {
  lang: string;
  meta: string | null;
  value: string;
}

/**
 * Extract execution context type from code block metadata
 */
export function extractExecutionContext(meta: string | null): 'test' | 'dev' | 'production' | 'default' {
  if (!meta) return 'default'

  if (meta.includes('test')) return 'test'
  if (meta.includes('dev')) return 'dev'
  if (meta.includes('production')) return 'production'

  return 'default'
}

/**
 * Create a mock execution context for testing
 */
export function createExecutionContext(type: 'test' | 'dev' | 'production' | 'default' = 'default') {
  return {
    on: function(event: string, callback: Function) {
      return () => {}; // Return unsubscribe function
    },
    
    send: function(event: string, data?: any) {
      return data;
    },
    
    emit: function(event: string, data?: any) {
      return data;
    }
  };
}

/**
 * Bundle code blocks and test blocks for testing
 */
export async function bundleCodeForTesting(codeBlocks: CodeBlock[], testBlocks: CodeBlock[]): Promise<string> {
  const context = createExecutionContext('test')
  
  const globalDeclarations = `
const on = ${context.on.toString()};
const send = ${context.send.toString()};
const emit = ${context.emit.toString()};

const ai = function(strings, ...values) {
  const prompt = String.raw({ raw: strings }, ...values);
  console.log('AI called with prompt:', prompt);
  return \`AI response for: \${prompt}\`;
};

ai.leanCanvas = function(params) { return { title: 'Lean Canvas', ...params }; };
ai.storyBrand = function(params) { return { title: 'Story Brand', ...params }; };
ai.landingPage = function(params) { return { title: 'Landing Page', ...params }; };

const db = {
  blog: {
    create: (title, content) => ({ id: 'test-id', title, content }),
    get: (id) => ({ id, title: 'Test Post', content: 'Test Content' }),
    list: () => [{ id: 'test-id', title: 'Test Post' }],
    update: (id, data) => ({ id, ...data }),
    delete: (id) => true
  }
};

const list = function*(strings, ...values) { 
  yield "Test item 1"; 
  yield "Test item 2";
};
const research = function(strings, ...values) {
  return "Research result";
};
const extract = function(strings, ...values) {
  return ["Extracted item 1", "Extracted item 2"];
};
`
  
  const combinedSource = [
    globalDeclarations,
    ...codeBlocks.map(block => block.value),
    ...testBlocks.map(block => block.value)
  ].join('\n\n')
  
  const result = await esbuild.transform(combinedSource, {
    loader: 'ts',
    target: 'es2020',
    format: 'esm',
  })
  
  return result.code
}

/**
 * Create a temporary test file from bundled code
 */
export async function createTempTestFile(bundledCode: string, fileName: string): Promise<string> {
  const tempDir = path.join(process.cwd(), '.mdxe')
  await fs.mkdir(tempDir, { recursive: true })

  const testFileName = path.basename(fileName, path.extname(fileName)) + '.test.ts'
  const testFilePath = path.join(tempDir, testFileName)

  const testFileContent = `
import { describe, it, expect, vi } from 'vitest'

${bundledCode}
`

  await fs.writeFile(testFilePath, testFileContent, 'utf-8')
  return testFilePath
}

/**
 * Run tests using Vitest
 */
export async function runTestsWithVitest(
  bundledCode: string,
  filePath: string,
  watch = false,
): Promise<{
  success: boolean
  output: string
  skipped?: number
}> {
  try {
    const testFilePath = await createTempTestFile(bundledCode, filePath)
    
    const watchFlag = watch ? '--watch' : ''
    const command = `npx vitest run --globals ${watchFlag} ${testFilePath}`
    
    const { stdout, stderr } = await execAsync(command)
    const output = stdout + stderr
    
    if (!watch) {
      await cleanupTempFiles()
    }
    
    const skippedMatch = output.match(/(\d+) skipped/i)
    const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0
    
    const success = !output.includes('FAIL') && !output.includes('ERR_')
    
    return { success, output, skipped }

  } catch (error: any) {
    await cleanupTempFiles()
    
    return {
      success: false,
      output: error.stdout + error.stderr || String(error),
      skipped: 0
    }
  }
}

/**
 * Clean up temporary test files
 */
export async function cleanupTempFiles(): Promise<void> {
  const tempDir = path.join(process.cwd(), '.mdxe')
  try {
    await fs.rm(tempDir, { recursive: true, force: true })
  } catch (error) {
    console.error('Error cleaning up temporary files:', error)
  }
}
