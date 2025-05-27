import { describe, it, expect } from 'vitest'
import { toTitleCase, extractCodeBlocks, categorizeCodeBlocks } from './index'

describe('@mdxe/esbuild', () => {
  describe('toTitleCase', () => {
    it('converts file paths to TitleCase', () => {
      expect(toTitleCase('hello-world.mdx')).toBe('HelloWorld')
      expect(toTitleCase('path/to/my-file.mdx')).toBe('PathToMyFile')
      expect(toTitleCase('simple.md')).toBe('Simple')
    })
  })

  describe('extractCodeBlocks', () => {
    it('extracts code blocks from MDX content', () => {
      const mdxContent = `
# Test Document

Some content here.

\`\`\`typescript exec
on('idea.captured', async (idea) => {
  console.log('Processing idea:', idea)
})
\`\`\`

More content.

\`\`\`typescript test
send('idea.captured', 'test idea')
\`\`\`

\`\`\`javascript
console.log('Regular JS block')
\`\`\`
      `

      const blocks = extractCodeBlocks(mdxContent)
      expect(blocks).toHaveLength(3)
      
      expect(blocks[0].lang).toBe('typescript')
      expect(blocks[0].meta).toBe('exec')
      expect(blocks[0].value).toContain('on(\'idea.captured\'')
      
      expect(blocks[1].lang).toBe('typescript')
      expect(blocks[1].meta).toBe('test')
      expect(blocks[1].value).toContain('send(\'idea.captured\'')
      
      expect(blocks[2].lang).toBe('javascript')
      expect(blocks[2].meta).toBe(null)
      expect(blocks[2].value).toContain('console.log(\'Regular JS block\')')
    })

    it('returns empty array when no code blocks are found', () => {
      const mdxContent = `
# Test Document

Just regular content, no code blocks.
      `

      const blocks = extractCodeBlocks(mdxContent)
      expect(blocks).toHaveLength(0)
    })
  })

  describe('categorizeCodeBlocks', () => {
    it('categorizes code blocks into executable and test blocks', () => {
      const codeBlocks = [
        { lang: 'typescript', meta: 'exec', value: 'console.log("exec")' },
        { lang: 'typescript', meta: 'test', value: 'console.log("test")' },
        { lang: 'javascript', meta: null, value: 'console.log("default")' },
        { lang: 'typescript', meta: 'execute', value: 'console.log("execute")' },
        { lang: 'python', meta: 'exec', value: 'print("python")' }, // Should be ignored
      ]

      const { executableBlocks, testBlocks } = categorizeCodeBlocks(codeBlocks)
      
      expect(executableBlocks).toHaveLength(3)
      expect(testBlocks).toHaveLength(1)
      
      expect(executableBlocks[0].meta).toBe('exec')
      expect(executableBlocks[1].meta).toBe(null) // Default JS block
      expect(executableBlocks[2].meta).toBe('execute')
      
      expect(testBlocks[0].meta).toBe('test')
    })

    it('ignores non-JS/TS code blocks', () => {
      const codeBlocks = [
        { lang: 'python', meta: 'exec', value: 'print("python")' },
        { lang: 'bash', meta: null, value: 'echo "bash"' },
        { lang: 'sql', meta: 'test', value: 'SELECT * FROM users' },
      ]

      const { executableBlocks, testBlocks } = categorizeCodeBlocks(codeBlocks)
      
      expect(executableBlocks).toHaveLength(0)
      expect(testBlocks).toHaveLength(0)
    })
  })
})
