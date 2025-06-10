import { describe, it, expect } from 'vitest'
import { toTitleCase, extractCodeBlocks, categorizeCodeBlocks, extractCodeBlocksWithSections, categorizeEnhancedCodeBlocks } from './index'
import { toCamelCase } from './ast-utils'

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

  describe('extractCodeBlocksWithSections', () => {
    it('tracks parent sections for code blocks', () => {
      const mdxContent = `
# Introduction

Some intro text.

\`\`\`typescript
const greeting = 'Hello World'
\`\`\`

## Setup Instructions

Setup details here.

\`\`\`javascript
function setup() {
  console.log('Setting up...')
}
\`\`\`

\`\`\`typescript
const config = { debug: true }
\`\`\`
      `

      const blocks = extractCodeBlocksWithSections(mdxContent)
      expect(blocks).toHaveLength(3)
      
      expect(blocks[0].parentSection).toBe('Introduction')
      expect(blocks[0].lang).toBe('typescript')
      expect(blocks[0].value).toContain('greeting')
      
      expect(blocks[1].parentSection).toBe('Setup Instructions')
      expect(blocks[1].lang).toBe('javascript')
      expect(blocks[1].value).toContain('setup')
      
      expect(blocks[2].parentSection).toBe('Setup Instructions')
      expect(blocks[2].lang).toBe('typescript')
      expect(blocks[2].value).toContain('config')
    })

    it('handles code blocks without parent sections', () => {
      const mdxContent = `
\`\`\`javascript
console.log('No parent section')
\`\`\`

# First Section

\`\`\`typescript
const withSection = true
\`\`\`
      `

      const blocks = extractCodeBlocksWithSections(mdxContent)
      expect(blocks).toHaveLength(2)
      
      expect(blocks[0].parentSection).toBeUndefined()
      expect(blocks[1].parentSection).toBe('First Section')
    })
  })

  describe('categorizeEnhancedCodeBlocks', () => {
    it('analyzes code blocks and classifies them correctly', () => {
      const enhancedBlocks = [
        {
          lang: 'typescript',
          meta: 'exec',
          value: 'const message = "Hello"; console.log(message);',
          type: 'mixed' as const,
          parentSection: 'Test Section',
          declarations: ['message'],
          isExported: false
        },
        {
          lang: 'javascript',
          meta: 'test',
          value: 'function testFunc() { return true; }',
          type: 'declaration' as const,
          parentSection: 'Tests',
          declarations: ['testFunc'],
          isExported: false
        },
        {
          lang: 'typescript',
          meta: null,
          value: 'console.log("Just a statement");',
          type: 'statement' as const,
          parentSection: 'Examples',
          declarations: [],
          isExported: false
        }
      ]

      const { executableBlocks, testBlocks } = categorizeEnhancedCodeBlocks(enhancedBlocks)
      
      expect(executableBlocks).toHaveLength(2)
      expect(testBlocks).toHaveLength(1)
      
      expect(executableBlocks[0].type).toBe('mixed')
      expect(executableBlocks[1].type).toBe('statement')
      expect(testBlocks[0].type).toBe('declaration')
    })
  })

  describe('toCamelCase', () => {
    it('converts section headings to camelCase function names', () => {
      expect(toCamelCase('Setup Instructions')).toBe('setupInstructions')
      expect(toCamelCase('API Reference')).toBe('apiReference')
      expect(toCamelCase('getting-started')).toBe('gettingStarted')
      expect(toCamelCase('Simple')).toBe('simple')
      expect(toCamelCase('Multiple   Spaces')).toBe('multipleSpaces')
      expect(toCamelCase('Special!@#Characters')).toBe('specialCharacters')
    })

    it('handles edge cases', () => {
      expect(toCamelCase('')).toBe('')
      expect(toCamelCase('123Numbers')).toBe('123Numbers')
      expect(toCamelCase('UPPERCASE')).toBe('uppercase')
    })
  })
})
