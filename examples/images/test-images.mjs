#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import { renderMdxCli } from '../../packages/mdxui/ink/dist/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const mdxPath = path.resolve(__dirname, './image-demo.mdx');
    
    // Render the MDX file
    await renderMdxCli(mdxPath, {
      // No input values needed for this example
    });
    
    console.log('\nImage component test completed successfully!');
  } catch (error) {
    console.error('Error testing image component:', error);
    process.exit(1);
  }
}

main();
