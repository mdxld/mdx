#!/usr/bin/env node
// Use ESM syntax for compatibility with Ink
import path from 'path';
import { fileURLToPath } from 'url';
import { renderMdxCli } from '../dist/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    // Path to the example MDX file
    const mdxPath = path.resolve(__dirname, './deploy.mdx');
    
    // Example input values
    const inputValues = {
      name: 'test-project',
      os: 'Ubuntu',
      memory: 1024,
      region: 'sfo'
    };
    
    // Render the MDX file with the provided input values
    const result = await renderMdxCli(mdxPath, {
      scope: inputValues
    });
    
    console.log('\nTest completed successfully!');
    console.log('Input values:', inputValues);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error testing schema validation:', error);
    process.exit(1);
  }
}

main();
