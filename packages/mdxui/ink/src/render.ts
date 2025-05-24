#!/usr/bin/env node
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { WorkflowFrontmatter, MdxPastelInkOptions } from './types';
import { createWorkflowFromFrontmatter } from './workflow';

async function compileMdx(mdxContent: string) {
  return { 
    Component: () => null,
    frontmatter: {} as any
  };
}

/**
 * Render an MDX file as a CLI app
 */
export async function renderMdxCli(mdxPath: string, options: Partial<MdxPastelInkOptions> = {}) {
  const resolvedPath = resolve(process.cwd(), mdxPath);
  console.log(`Loading MDX file: ${resolvedPath}`);
  
  try {
    const mdxContent = readFileSync(resolvedPath, 'utf8');
    const { Component, frontmatter } = await compileMdx(mdxContent);
    
    if ((frontmatter as WorkflowFrontmatter).workflow) {
      console.log('Workflow detected in frontmatter:');
      const workflow = createWorkflowFromFrontmatter(frontmatter as WorkflowFrontmatter);
      console.log(`- ID: ${workflow?.id}`);
      console.log(`- Name: ${workflow?.name}`);
      console.log(`- Steps: ${workflow?.steps.length}`);
      
      workflow?.steps.forEach((step, index) => {
        console.log(`\nStep ${index + 1}: ${step.name}`);
        console.log(`- ID: ${step.id}`);
        if (step.description) console.log(`- Description: ${step.description}`);
        console.log(`- Has input schema: ${!!step.inputSchema}`);
        console.log(`- Has output schema: ${!!step.outputSchema}`);
      });
    }
    
    console.log('\nRendering MDX content:');
    // render(<Component />);
    
    return options.scope || {};
  } catch (error) {
    console.error('Error processing MDX file:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node render.js <mdx-file>');
    process.exit(1);
  }

  try {
    await renderMdxCli(args[0]);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
