import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';
import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';

/**
 * Represents a code block extracted from MDX content
 */
export interface CodeBlock {
  lang: string;
  meta: string | null;
  value: string;
}

/**
 * Extract code blocks from MDX content
 */
export function extractCodeBlocks(mdxContent: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  
  const tree = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .parse(mdxContent);
  
  visit(tree, 'code', (node: any) => {
    codeBlocks.push({
      lang: node.lang || '',
      meta: node.meta || null,
      value: node.value || '',
    });
  });
  
  return codeBlocks;
}

/**
 * Find all MDX files in a directory
 */
export async function findMdxFiles(dir: string): Promise<string[]> {
  try {
    const files = await globby(['**/*.md', '**/*.mdx'], {
      cwd: dir,
      absolute: true,
    });
    return files;
  } catch (error) {
    console.error('Error finding MDX files:', error);
    return [];
  }
}

/**
 * Extract testing and non-testing code blocks from an MDX file
 */
export async function extractMdxCodeBlocks(filePath: string): Promise<{
  testBlocks: CodeBlock[];
  codeBlocks: CodeBlock[];
}> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const blocks = extractCodeBlocks(content);
    
    const testBlocks = blocks.filter(block => 
      (block.lang === 'typescript' || block.lang === 'ts' || block.lang === 'js' || block.lang === 'javascript') && 
      block.meta?.includes('test')
    );
    
    const codeBlocks = blocks.filter(block => 
      (block.lang === 'typescript' || block.lang === 'ts' || block.lang === 'js' || block.lang === 'javascript') && 
      !block.meta?.includes('test')
    );
    
    return { testBlocks, codeBlocks };
  } catch (error) {
    console.error(`Error extracting code blocks from ${filePath}:`, error);
    return { testBlocks: [], codeBlocks: [] };
  }
}
