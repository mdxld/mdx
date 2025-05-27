import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { executeCodeBlock, executeCodeBlocks, executeMdxCodeBlocks } from './execution-engine'
import type { CodeBlock } from './mdx-parser'

describe('execution-engine', () => {
  describe('executeCodeBlock', () => {
    it('executes simple TypeScript code', async () => {
      const codeBlock: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'return 2 + 3;',
      }

      const result = await executeCodeBlock(codeBlock)

      expect(result.success).toBe(true)
      expect(result.result).toBe(5)
      expect(result.duration).toBeGreaterThan(0)
    })

    it('handles TypeScript with type annotations', async () => {
      const codeBlock: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'const num: number = 42; return num * 2;',
      }

      const result = await executeCodeBlock(codeBlock)

      expect(result.success).toBe(true)
      expect(result.result).toBe(84)
    })

    it('handles async code', async () => {
      const codeBlock: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'await new Promise(resolve => setTimeout(resolve, 10)); return "done";',
      }

      const result = await executeCodeBlock(codeBlock)

      expect(result.success).toBe(true)
      expect(result.result).toBe('done')
    })

    it('handles syntax errors', async () => {
      const codeBlock: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'const invalid syntax here',
      }

      const result = await executeCodeBlock(codeBlock)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('skips unsupported languages', async () => {
      const codeBlock: CodeBlock = {
        lang: 'python',
        meta: null,
        value: 'print("hello")',
      }

      const result = await executeCodeBlock(codeBlock)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unsupported language')
    })
  })

  describe('console output capture', () => {
    let originalConsole: any

    beforeEach(() => {
      originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
      }
    })

    afterEach(() => {
      Object.assign(console, originalConsole)
    })

    it('captures console.log outputs', async () => {
      const codeBlock: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: 'console.log("Hello, world!"); return 42;',
      }

      const result = await executeCodeBlock(codeBlock)

      expect(result.success).toBe(true)
      expect(result.result).toBe(42)
      expect(result.outputs).toBeDefined()
      expect(result.outputs?.length).toBe(1)
      expect(result.outputs?.[0].type).toBe('log')
      expect(result.outputs?.[0].args[0]).toBe('Hello, world!')
    })

    it('captures multiple console outputs of different types', async () => {
      const codeBlock: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: `
          console.log("Log message");
          console.error("Error message");
          console.warn("Warning message");
          console.info("Info message");
          return "done";
        `,
      }

      const result = await executeCodeBlock(codeBlock)

      expect(result.success).toBe(true)
      expect(result.outputs).toBeDefined()
      expect(result.outputs?.length).toBe(4)

      const outputTypes = result.outputs?.map((o) => o.type) || []
      expect(outputTypes).toContain('log')
      expect(outputTypes).toContain('error')
      expect(outputTypes).toContain('warn')
      expect(outputTypes).toContain('info')

      const logOutput = result.outputs?.find((o) => o.type === 'log')
      expect(logOutput?.args[0]).toBe('Log message')

      const errorOutput = result.outputs?.find((o) => o.type === 'error')
      expect(errorOutput?.args[0]).toBe('Error message')
    })

    it('captures console outputs with async code', async () => {
      const codeBlock: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: `
          console.log("Before await");
          await new Promise(resolve => setTimeout(resolve, 10));
          console.log("After await");
          return "done";
        `,
      }

      const result = await executeCodeBlock(codeBlock)

      expect(result.success).toBe(true)
      expect(result.outputs).toBeDefined()

      const testOutputs = result.outputs?.filter((o) => o.args[0] === 'Before await' || o.args[0] === 'After await')

      expect(testOutputs?.length).toBe(2)
      expect(testOutputs?.[0].args[0]).toBe('Before await')
      expect(testOutputs?.[1].args[0]).toBe('After await')
    })

    it('captures console outputs with complex objects', async () => {
      const codeBlock: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: `
          const obj = { name: "Test", value: 42 };
          console.log("Object:", obj);
          return true;
        `,
      }

      const result = await executeCodeBlock(codeBlock)

      expect(result.success).toBe(true)
      expect(result.outputs).toBeDefined()
      expect(result.outputs?.length).toBe(1)
      expect(result.outputs?.[0].args[0]).toBe('Object:')
      expect(result.outputs?.[0].args[1]).toEqual({ name: 'Test', value: 42 })
    })
  })

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
      `

      const results = await executeMdxCodeBlocks(mdxContent)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[0].result).toBe('first block')
      expect(results[1].success).toBe(true)
      expect(results[1].result).toBe('second block')
    })

    it('supports event sending in code blocks', async () => {
      const codeBlock: CodeBlock = {
        lang: 'typescript',
        meta: null,
        value: `
          on('test-event', (data) => data.value * 2);
          const result = await emit('test-event', { value: 21 });
          return result.results[0];
        `,
      }

      const result = await executeCodeBlock(codeBlock)

      expect(result.success).toBe(true)
      expect(result.result).toBe(42)
    })

    it('captures console outputs across multiple code blocks', async () => {
      const mdxContent = `
# Test Document

\`\`\`typescript
console.log("First block output");
return "first block";
\`\`\`

Some text here.

\`\`\`typescript
console.error("Second block error");
return "second block";
\`\`\`
      `

      const results = await executeMdxCodeBlocks(mdxContent)

      expect(results).toHaveLength(2)

      expect(results[0].outputs).toBeDefined()
      expect(results[0].outputs?.length).toBe(1)
      expect(results[0].outputs?.[0].type).toBe('log')
      expect(results[0].outputs?.[0].args[0]).toBe('First block output')

      expect(results[1].outputs).toBeDefined()
      expect(results[1].outputs?.length).toBe(1)
      expect(results[1].outputs?.[0].type).toBe('error')
      expect(results[1].outputs?.[0].args[0]).toBe('Second block error')
    })
  })
})
