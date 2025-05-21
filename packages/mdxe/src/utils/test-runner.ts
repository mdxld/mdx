import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { CodeBlock } from './mdx-parser';

const execAsync = promisify(exec);

/**
 * Create a temporary test file from extracted code blocks
 */
export async function createTempTestFile(codeBlocks: CodeBlock[], testBlocks: CodeBlock[], fileName: string): Promise<string> {
  const tempDir = path.join(process.cwd(), '.mdxe-temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const testFileName = path.basename(fileName, path.extname(fileName)) + '.spec.ts';
  const testFilePath = path.join(tempDir, testFileName);
  
  let fileContent = '';
  
  codeBlocks.forEach(block => {
    fileContent += block.value + '\n\n';
  });
  
  testBlocks.forEach(block => {
    fileContent += block.value + '\n\n';
  });
  
  await fs.writeFile(testFilePath, fileContent, 'utf-8');
  return testFilePath;
}

/**
 * Run tests using Vitest
 */
export async function runTests(testFiles: string[], watch = false): Promise<{
  success: boolean;
  output: string;
}> {
  try {
    const watchFlag = watch ? '--watch' : '';
    const command = `npx vitest run ${watchFlag} ${testFiles.join(' ')}`;
    
    const { stdout, stderr } = await execAsync(command);
    const output = stdout + stderr;
    
    const success = !output.includes('FAIL') && !output.includes('ERR_');
    
    return { success, output };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout + error.stderr,
    };
  }
}

/**
 * Clean up temporary test files
 */
export async function cleanupTempFiles(): Promise<void> {
  const tempDir = path.join(process.cwd(), '.mdxe-temp');
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Error cleaning up temporary files:', error);
  }
}
