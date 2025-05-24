#!/usr/bin/env node
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { render } from 'ink';
import { createWorkflowFromFrontmatter } from './workflow';
import type { WorkflowFrontmatter } from './types';

async function compileMdx(mdxContent: string) {
  return { 
    Component: () => null,
    frontmatter: {} as any
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node render.js <mdx-file>');
    process.exit(1);
  }

  const mdxPath = resolve(process.cwd(), args[0]);
  console.log(`Loading MDX file: ${mdxPath}`);
  
  try {
    const mdxContent = readFileSync(mdxPath, 'utf8');
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
  } catch (error) {
    console.error('Error processing MDX file:', error);
    process.exit(1);
  }
}

main().catch(console.error);
