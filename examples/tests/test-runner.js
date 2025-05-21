#!/usr/bin/env node

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Simple wrapper script that calls the mdxe test command
 */
async function runTests() {
  try {
    const cliPath = path.resolve(__dirname, '../../packages/mdxe/dist/cli.cjs');
    
    if (!fs.existsSync(cliPath)) {
      throw new Error(`Could not find mdxe CLI at ${cliPath}`);
    }
    
    const watchFlag = process.argv.includes('--watch') ? '--watch' : '';
    const command = `node ${cliPath} test ${watchFlag}`;
    
    console.log(`Running command: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    return !stderr.includes('Error') && !stdout.includes('❌');
  } catch (error) {
    console.error('Error running tests:', error.message);
    console.log(error.stdout || '');
    console.error(error.stderr || '');
    return false;
  }
}

runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
