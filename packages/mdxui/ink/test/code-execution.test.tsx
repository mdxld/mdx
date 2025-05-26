import { describe, it, expect, vi } from 'vitest';
import { extractCodeBlocks, executeCodeBlocks } from '../src/code-execution';

describe('Code Execution Utilities', () => {
  describe('extractCodeBlocks', () => {
    it('should extract TypeScript code blocks from MDX content', () => {
      const mdxContent = `
# Test MDX

Some content here.

\`\`\`typescript
console.log('Hello');
\`\`\`

More content.

\`\`\`typescript
const x = 1 + 1;
console.log(x);
\`\`\`
      `;

      const blocks = extractCodeBlocks(mdxContent);
      expect(blocks).toHaveLength(2);
      expect(blocks[0]).toBe("console.log('Hello');");
      expect(blocks[1]).toBe("const x = 1 + 1;\nconsole.log(x);");
    });

    it('should return empty array when no code blocks are found', () => {
      const mdxContent = `
# Test MDX

Just regular content, no code blocks.
      `;

      const blocks = extractCodeBlocks(mdxContent);
      expect(blocks).toHaveLength(0);
    });
  });

  describe('executeCodeBlocks', () => {
    it('should execute TypeScript code blocks and capture output', async () => {
      const mdxContent = `
# Test MDX

\`\`\`typescript
console.log('Hello from test');
\`\`\`
      `;

      const originalLog = console.log;
      const mockLog = vi.fn();
      console.log = mockLog;

      try {
        const results = await executeCodeBlocks(mdxContent);
        expect(results).toHaveLength(1);
        expect(results[0].success).toBe(true);
        expect(results[0].output).toContain('Hello from test');
      } finally {
        console.log = originalLog;
      }
    });

    it('should handle errors in code execution', async () => {
      const mdxContent = `
# Test MDX

\`\`\`typescript
throw new Error('Test error');
\`\`\`
      `;

      const results = await executeCodeBlocks(mdxContent);
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Test error');
    });
  });
});
