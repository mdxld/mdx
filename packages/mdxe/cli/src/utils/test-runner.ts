import fs from 'node:fs/promises'
import path from 'node:path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import * as esbuild from 'esbuild'
import type { CodeBlock } from './mdx-parser'

const execAsync = promisify(exec)

/**
 * Bundle code blocks and test blocks for testing
 */
export async function bundleCodeForTesting(codeBlocks: CodeBlock[], testBlocks: CodeBlock[]): Promise<string> {
  const combinedSource = [
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

  await fs.writeFile(testFilePath, bundledCode, 'utf-8')
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
    
    const success = !output.includes('FAIL') && !output.includes('ERR_')
    
    return { success, output }
  } catch (error: any) {
    await cleanupTempFiles()
    
    return {
      success: false,
      output: error.stdout + error.stderr || String(error),
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
