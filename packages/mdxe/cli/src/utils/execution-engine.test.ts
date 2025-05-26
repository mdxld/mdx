import { describe, it, expect, vi } from 'vitest';
import { executeCodeBlock, executeCodeBlocks, executeMdxCodeBlocks } from './execution-engine';
import type { CodeBlock } from './mdx-parser';

describe('execution-engine', () => {
  describe('executeCodeBlock', () => {
    it('executes simple TypeScript code', async () => {
      const codeBlock: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'return 2 + 3;'
      };
      
      const result = await executeCodeBlock(codeBlock);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(5);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('handles TypeScript with type annotations', async () => {
      const codeBlock: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'const num: number = 42; return num * 2;'
      };
      
      const result = await executeCodeBlock(codeBlock);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(84);
    });

    it('handles async code', async () => {
      const codeBlock: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'await new Promise(resolve => setTimeout(resolve, 10)); return "done";'
      };
      
      const result = await executeCodeBlock(codeBlock);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('done');
    });

    it('handles syntax errors', async () => {
      const codeBlock: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'const invalid syntax here'
      };
      
      const result = await executeCodeBlock(codeBlock);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('skips unsupported languages', async () => {
      const codeBlock: CodeBlock = {
        lang: 'python',
        meta: null,
        value: 'print("hello")'
      };
      
      const result = await executeCodeBlock(codeBlock);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported language');
    });
  });

  describe('executeMdxCodeBlocks', () => {
    it('extracts and executes code blocks from MDX', async () => {
      const mdxContent = `
# Test Document

\`\`\`typescript
return "first block";
\`\`\`

Some text here.

\`\`\`typescript
return "second block";
\`\`\`
      `;
      
      const results = await executeMdxCodeBlocks(mdxContent);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].result).toBe('first block');
      expect(results[1].success).toBe(true);
      expect(results[1].result).toBe('second block');
    });
  });
});
