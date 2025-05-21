#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { extractMdxCodeBlocks, findMdxFiles } from './mdx-parser.js';

const execAsync = promisify(exec);

/**
 * Create a temporary test file from extracted code blocks
 */
async function createTempTestFile(codeBlocks, testBlocks, fileName) {
  const tempDir = path.join(process.cwd(), '.mdxe-temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const testFileName = path.basename(fileName, path.extname(fileName)) + '.spec.js';
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
async function runTests(testFiles, watch = false) {
  try {
    const watchFlag = watch ? '--watch' : '';
    const command = `npx vitest run ${watchFlag} ${testFiles.join(' ')}`;
    
    const { stdout, stderr } = await execAsync(command);
    const output = stdout + stderr;
    
    const success = !output.includes('FAIL') && !output.includes('ERR_');
    
    return { success, output };
  } catch (error) {
    return {
      success: false,
      output: error.stdout + error.stderr,
    };
  }
}

/**
 * Clean up temporary test files
 */
async function cleanupTempFiles() {
  const tempDir = path.join(process.cwd(), '.mdxe-temp');
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Error cleaning up temporary files:', error);
  }
}

async function runMdxTests() {
  try {
    console.log('🔍 Finding MDX files...');
    const files = await findMdxFiles(process.cwd());
    
    if (files.length === 0) {
      console.log('❌ No MDX files found in the current directory.');
      return;
    }
    
    console.log(`📝 Found ${files.length} MDX file(s)`);
    
    const testFiles = [];
    let hasTests = false;
    
    for (const file of files) {
      const { testBlocks, codeBlocks } = await extractMdxCodeBlocks(file);
      
      if (testBlocks.length > 0) {
        hasTests = true;
        console.log(`🧪 Found ${testBlocks.length} test block(s) in ${path.basename(file)}`);
        const testFile = await createTempTestFile(codeBlocks, testBlocks, file);
        testFiles.push(testFile);
      }
    }
    
    if (!hasTests) {
      console.log('❌ No test blocks found in MDX files.');
      await cleanupTempFiles();
      return;
    }
    
    console.log('🚀 Running tests...');
    const { success, output } = await runTests(testFiles, process.argv.includes('--watch'));
    
    console.log(output);
    
    if (success) {
      console.log('✅ All tests passed!');
    } else {
      console.log('❌ Some tests failed.');
      process.exitCode = 1;
    }
    
    if (!process.argv.includes('--watch')) {
      await cleanupTempFiles();
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exitCode = 1;
    await cleanupTempFiles();
  }
}

runMdxTests();
