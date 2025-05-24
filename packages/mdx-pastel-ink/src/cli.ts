#!/usr/bin/env node
import { renderMdxCli } from './render';
import path from 'path';
import { z } from 'zod';

async function main() {
  const mdxPath = process.argv[2];
  
  if (!mdxPath) {
    console.error('Please provide a path to an MDX file');
    process.exit(1);
  }
  
  const inputArgs = process.argv.slice(3);
  const inputValues: Record<string, any> = {};
  
  for (const arg of inputArgs) {
    const [key, value] = arg.split('=');
    if (key && value) {
      inputValues[key] = value;
    }
  }
  
  try {
    const resolvedPath = path.resolve(process.cwd(), mdxPath);
    
    const result = await renderMdxCli(resolvedPath, {
      scope: inputValues
    });
    
    if (result) {
      console.log('\nResult:', result);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Input validation error:');
      console.error(error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n'));
    } else {
      console.error('Error rendering MDX CLI:', error);
    }
    process.exit(1);
  }
}

main();
