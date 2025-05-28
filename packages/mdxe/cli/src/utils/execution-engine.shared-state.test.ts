import { describe, it, expect, beforeEach } from 'vitest'
import { executeCodeBlock, executeCodeBlocks, executeMdxCodeBlocks } from './execution-engine'
import type { CodeBlock } from './mdx-parser'

describe('execution-engine shared state', () => {
  describe('shared state between code blocks', () => {
    it('maintains shared state between code blocks with same fileId', async () => {
      const codeBlock1: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'exportVar("sharedValue", 42); return true;',
      }
      
      const codeBlock2: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'return importVar("sharedValue");',
      }
      
      const fileId = 'test-file-1'
      
      const result1 = await executeCodeBlock(codeBlock1, { fileId })
      expect(result1.success).toBe(true)
      
      const result2 = await executeCodeBlock(codeBlock2, { fileId })
      expect(result2.success).toBe(true)
      expect(result2.result).toBe(42)
    })
    
    it('isolates state between different fileIds', async () => {
      const codeBlock1: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'exportVar("sharedValue", "file1-value"); return true;',
      }
      
      const codeBlock2: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'exportVar("sharedValue", "file2-value"); return true;',
      }
      
      const codeBlock3: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'return importVar("sharedValue");',
      }
      
      await executeCodeBlock(codeBlock1, { fileId: 'file1' })
      await executeCodeBlock(codeBlock2, { fileId: 'file2' })
      
      const result1 = await executeCodeBlock(codeBlock3, { fileId: 'file1' })
      const result2 = await executeCodeBlock(codeBlock3, { fileId: 'file2' })
      
      expect(result1.result).toBe('file1-value')
      expect(result2.result).toBe('file2-value')
    })
    
    it('allows complex objects to be shared between code blocks', async () => {
      const codeBlock1: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'exportVar("complexObject", { name: "Test", values: [1, 2, 3], nested: { prop: "value" } }); return true;',
      }
      
      const codeBlock2: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'const obj = importVar("complexObject"); return obj.nested.prop;',
      }
      
      const fileId = 'test-complex-objects'
      
      await executeCodeBlock(codeBlock1, { fileId })
      const result = await executeCodeBlock(codeBlock2, { fileId })
      
      expect(result.success).toBe(true)
      expect(result.result).toBe('value')
    })
    
    it('allows updating shared values between code blocks', async () => {
      const codeBlock1: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'exportVar("counter", 1); return true;',
      }
      
      const codeBlock2: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'const current = importVar("counter"); exportVar("counter", current + 1); return current;',
      }
      
      const fileId = 'test-updates'
      
      await executeCodeBlock(codeBlock1, { fileId })
      
      const result1 = await executeCodeBlock(codeBlock2, { fileId })
      expect(result1.result).toBe(1)
      
      const result2 = await executeCodeBlock(codeBlock2, { fileId })
      expect(result2.result).toBe(2)
      
      const result3 = await executeCodeBlock(codeBlock2, { fileId })
      expect(result3.result).toBe(3)
    })
    
    it('works with executeCodeBlocks for multiple blocks', async () => {
      const codeBlocks: CodeBlock[] = [
        {
          lang: 'typescript',
          meta: null,
          value: 'exportVar("sequence", []); return "first";',
        },
        {
          lang: 'typescript',
          meta: null,
          value: 'const seq = importVar("sequence"); seq.push("second"); exportVar("sequence", seq); return "second";',
        },
        {
          lang: 'typescript',
          meta: null,
          value: 'const seq = importVar("sequence"); seq.push("third"); return seq;',
        }
      ]
      
      const fileId = 'test-multiple-blocks'
      const results = await executeCodeBlocks(codeBlocks, { fileId })
      
      expect(results).toHaveLength(3)
      expect(results[0].result).toBe('first')
      expect(results[1].result).toBe('second')
      expect(results[2].result).toEqual(['second', 'third'])
    })
    
    it('works with executeMdxCodeBlocks for MDX content', async () => {
      const mdxContent = `
# Test Document

\`\`\`typescript
exportVar("mdxValue", "Hello from MDX");
console.log("First block executed");
return true;
\`\`\`

Some text here.

\`\`\`typescript
const value = importVar("mdxValue");
console.log("Retrieved value:", value);
return value;
\`\`\`
      `
      
      const fileId = 'test-mdx-content'
      const results = await executeMdxCodeBlocks(mdxContent, { fileId })
      
      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(results[1].result).toBe('Hello from MDX')
      
      expect(results[0].outputs?.[0].args[0]).toBe('First block executed')
      expect(results[1].outputs?.[0].args[0]).toBe('Retrieved value:')
      expect(results[1].outputs?.[0].args[1]).toBe('Hello from MDX')
    })
  })
})
