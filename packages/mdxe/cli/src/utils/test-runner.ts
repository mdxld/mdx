import fs from 'node:fs/promises'
import path from 'node:path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import type { CodeBlock } from './mdx-parser'

const execAsync = promisify(exec)

/**
 * Create a temporary test file from extracted code blocks
 */
export async function createTempTestFile(codeBlocks: CodeBlock[], testBlocks: CodeBlock[], fileName: string): Promise<string> {
  const tempDir = path.join(process.cwd(), '.mdxe')
  await fs.mkdir(tempDir, { recursive: true })

  const testFileName = path.basename(fileName, path.extname(fileName)) + '.test.ts'
  const testFilePath = path.join(tempDir, testFileName)

  let fileContent = `
const on = (event, callback) => callback;
const send = (event, data) => ({ event, data });
const ai = new Proxy({}, {
  apply: (_target, _thisArg, args) => \`AI response for: \${args[0]}\`,
  get: (_target, prop) => (...args) => ({ function: prop, args })
});
const list = (strings, ...values) => {
  const input = strings.reduce((acc, str, i) => 
    acc + str + (values[i] !== undefined ? JSON.stringify(values[i]) : ''), '');
  return {
    [Symbol.asyncIterator]: async function* () {
      for (let i = 1; i <= 3; i++) {
        yield \`Item \${i} for \${input}\`;
      }
    }
  };
};
const research = (strings, ...values) => {
  const input = strings.reduce((acc, str, i) => 
    acc + str + (values[i] !== undefined ? JSON.stringify(values[i]) : ''), '');
  return \`Research results for: \${input}\`;
};
const extract = (strings, ...values) => {
  const input = strings.reduce((acc, str, i) => 
    acc + str + (values[i] !== undefined ? JSON.stringify(values[i]) : ''), '');
  return {
    [Symbol.asyncIterator]: async function* () {
      for (let i = 1; i <= 3; i++) {
        yield \`Extracted item \${i} from \${input}\`;
      }
    }
  };
};
const db = new Proxy({}, {
  get: (_target, collection) => ({
    create: (title, content) => ({ collection, title, content }),
    find: (query) => ({ collection, query })
  })
});

`

  codeBlocks.forEach((block) => {
    fileContent += block.value + '\n\n'
  })

  testBlocks.forEach((block) => {
    fileContent += block.value + '\n\n'
  })

  await fs.writeFile(testFilePath, fileContent, 'utf-8')
  return testFilePath
}

/**
 * Run tests using Vitest
 */
export async function runTests(
  testFiles: string[],
  watch = false,
): Promise<{
  success: boolean
  output: string
}> {
  try {
    // Separate MDX files from regular test files
    const mdxFiles = testFiles.filter(file => file.endsWith('.mdx') || file.endsWith('.md'))
    const regularTestFiles = testFiles.filter(file => !file.endsWith('.mdx') && !file.endsWith('.md'))
    
    const tempTestFiles: string[] = []
    
    // Process MDX files - extract test blocks and create temporary test files
    for (const mdxFile of mdxFiles) {
      const { extractMdxCodeBlocks } = await import('./mdx-parser')
      const { testBlocks, codeBlocks } = await extractMdxCodeBlocks(mdxFile)
      
      if (testBlocks.length > 0) {
        const tempFile = await createTempTestFile(codeBlocks, testBlocks, mdxFile)
        tempTestFiles.push(tempFile)
      }
    }
    
    const allTestFiles = [...regularTestFiles, ...tempTestFiles]
    
    if (allTestFiles.length === 0) {
      return {
        success: false,
        output: 'No test files or test blocks found'
      }
    }
    
    const watchFlag = watch ? '--watch' : ''
    await import('vitest/node')
    
    const command = `npx vitest run --globals ${watchFlag} ${allTestFiles.join(' ')}`
    const { stdout, stderr } = await execAsync(command)
    const output = stdout + stderr
    
    const success = !output.includes('FAIL') && !output.includes('ERR_')
    
    if (!watch && tempTestFiles.length > 0) {
      await cleanupTempFiles()
    }
    
    return { success, output }
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout + error.stderr,
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
