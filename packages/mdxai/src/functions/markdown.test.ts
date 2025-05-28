import { describe, it, expect, vi } from 'vitest'
import { markdown } from './markdown.js'

// Mock the AI module
vi.mock('../ai', () => ({
  model: vi.fn(() => 'mocked-model'),
}))

// Mock the generateText function
vi.mock('ai', () => ({
  generateText: vi.fn(),
}))

import { generateText } from 'ai'

const mockGenerateText = generateText as any

describe('markdown function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate markdown with string parameter', async () => {
    const mockMarkdown = '# Hello World\n\nThis is a test markdown document.\n\n- Item 1\n- Item 2'
    
    mockGenerateText.mockResolvedValue({
      text: mockMarkdown,
    })

    const result = await markdown('Write a hello world guide')

    expect(mockGenerateText).toHaveBeenCalledWith({
      model: 'mocked-model',
      system: 'You are a helpful assistant that responds in well-formatted markdown. Use proper markdown syntax including headers, lists, code blocks, links, and other formatting as appropriate for the content.',
      prompt: 'Write a hello world guide',
    })

    expect(result).toHaveProperty('markdown', mockMarkdown)
    expect(result).toHaveProperty('mdast')
    expect(result.mdast).toHaveProperty('type', 'root')
    expect(result.mdast).toHaveProperty('children')
    expect(Array.isArray(result.mdast.children)).toBe(true)
  })

  it('should generate markdown with template literal', async () => {
    const mockMarkdown = '# JavaScript Guide\n\nThis is a comprehensive guide about JavaScript.\n\n## Features\n\n- Dynamic typing\n- First-class functions'
    
    mockGenerateText.mockResolvedValue({
      text: mockMarkdown,
    })

    const topic = 'JavaScript'
    const result = await markdown`Write a comprehensive guide about ${topic}`

    expect(mockGenerateText).toHaveBeenCalledWith({
      model: 'mocked-model',
      system: 'You are a helpful assistant that responds in well-formatted markdown. Use proper markdown syntax including headers, lists, code blocks, links, and other formatting as appropriate for the content.',
      prompt: 'Write a comprehensive guide about JavaScript',
    })

    expect(result).toHaveProperty('markdown', mockMarkdown)
    expect(result).toHaveProperty('mdast')
    expect(result.mdast).toHaveProperty('type', 'root')
  })

  it('should handle template literals with objects', async () => {
    const mockMarkdown = '# API Documentation\n\nEndpoints:\n- GET /users\n- POST /users'
    
    mockGenerateText.mockResolvedValue({
      text: mockMarkdown,
    })

    const apiConfig = {
      name: 'User API',
      endpoints: ['GET /users', 'POST /users']
    }

    const result = await markdown`Document the ${apiConfig} API`

    expect(mockGenerateText).toHaveBeenCalledWith({
      model: 'mocked-model',
      system: 'You are a helpful assistant that responds in well-formatted markdown. Use proper markdown syntax including headers, lists, code blocks, links, and other formatting as appropriate for the content.',
      prompt: 'Document the name: User API\nendpoints:\n  - GET /users\n  - POST /users API',
    })

    expect(result).toHaveProperty('markdown', mockMarkdown)
    expect(result).toHaveProperty('mdast')
  })

  it('should parse markdown into proper MDAST structure', async () => {
    const mockMarkdown = '# Title\n\nParagraph with **bold** text.\n\n```javascript\nconsole.log("hello")\n```'
    
    mockGenerateText.mockResolvedValue({
      text: mockMarkdown,
    })

    const result = await markdown('Generate a code example')

    expect(result.mdast.type).toBe('root')
    expect(result.mdast.children).toHaveLength(3) // heading, paragraph, code block
    
    // Check heading
    expect(result.mdast.children[0].type).toBe('heading')
    expect(result.mdast.children[0].depth).toBe(1)
    
    // Check paragraph with strong text
    expect(result.mdast.children[1].type).toBe('paragraph')
    expect(result.mdast.children[1].children).toContainEqual(
      expect.objectContaining({ type: 'strong' })
    )
    
    // Check code block
    expect(result.mdast.children[2].type).toBe('code')
    expect(result.mdast.children[2].lang).toBe('javascript')
    expect(result.mdast.children[2].value).toBe('console.log("hello")')
  })

  it('should throw error for invalid arguments', async () => {
    // Test with invalid arguments (not string or template literal)
    await expect(async () => {
      // @ts-expect-error - Testing invalid usage
      await markdown(123)
    }).rejects.toThrow('Markdown function must be called with a string or as a template literal')
  })

  it('should handle empty markdown response', async () => {
    mockGenerateText.mockResolvedValue({
      text: '',
    })

    const result = await markdown('Generate empty content')

    expect(result.markdown).toBe('')
    expect(result.mdast).toBeDefined()
    expect(result.mdast.type).toBe('root')
    expect(result.mdast.children).toEqual([])
  })

  it('should handle complex markdown with multiple elements', async () => {
    const complexMarkdown = `# Main Title

## Subtitle

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2

> This is a blockquote

\`\`\`javascript
console.log('Hello, world!')
\`\`\`

[Link text](https://example.com)`

    mockGenerateText.mockResolvedValue({
      text: complexMarkdown,
    })

    const result = await markdown('Generate complex markdown')

    expect(result.markdown).toBe(complexMarkdown)
    expect(result.mdast).toBeDefined()
    expect(result.mdast.type).toBe('root')
    expect(result.mdast.children).toBeDefined()
    expect(Array.isArray(result.mdast.children)).toBe(true)

    // Check for various node types in the AST
    const nodeTypes = result.mdast.children.map((child: any) => child.type)
    expect(nodeTypes).toContain('heading')
    expect(nodeTypes).toContain('paragraph')
    expect(nodeTypes).toContain('list')
    expect(nodeTypes).toContain('blockquote')
    expect(nodeTypes).toContain('code')
  })
}) 