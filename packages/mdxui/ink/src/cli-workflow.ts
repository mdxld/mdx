#!/usr/bin/env node
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseFrontmatter } from './frontmatter';
import { createWorkflowFromFrontmatter } from './workflow';
import type { WorkflowFrontmatter } from './types';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node cli-workflow.js <mdx-file>');
    process.exit(1);
  }

  const mdxPath = resolve(process.cwd(), args[0]);
  console.log(`Loading MDX file: ${mdxPath}`);
  
  try {
    const mdxContent = readFileSync(mdxPath, 'utf8');
    const { frontmatter } = parseFrontmatter(mdxContent);
    
    if ((frontmatter as WorkflowFrontmatter).workflow) {
      console.log('Workflow detected in frontmatter:');
      const workflow = createWorkflowFromFrontmatter(frontmatter as WorkflowFrontmatter);
      
      if (!workflow) {
        console.log('No valid workflow found in frontmatter');
        process.exit(1);
      }
      
      console.log(`- ID: ${workflow.id}`);
      console.log(`- Name: ${workflow.name}`);
      console.log(`- Description: ${workflow.description || 'N/A'}`);
      console.log(`- Steps: ${workflow.steps.length}`);
      
      workflow.steps.forEach((step, index) => {
        console.log(`\nStep ${index + 1}: ${step.name}`);
        console.log(`- ID: ${step.id}`);
        if (step.description) console.log(`- Description: ${step.description}`);
        console.log(`- Has input schema: ${!!step.inputSchema}`);
        console.log(`- Has output schema: ${!!step.outputSchema}`);
      });
    } else {
      console.log('No workflow found in frontmatter');
    }
  } catch (error) {
    console.error('Error processing MDX file:', error);
    process.exit(1);
  }
}

main().catch(console.error);
