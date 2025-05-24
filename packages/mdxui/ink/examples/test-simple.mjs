#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import { renderMdxCli } from '../dist/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const mdxPath = path.resolve(__dirname, './simple-example.mdx');
    
    // Example input values
    const inputValues = {
      name: 'World',
      greeting: 'Hello'
    };
    
    // Render the MDX file with the provided input values
    await renderMdxCli(mdxPath, {
      scope: inputValues
    });
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing simple example:', error);
    process.exit(1);
  }
}

main();
