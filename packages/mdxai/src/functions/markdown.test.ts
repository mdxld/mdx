import 'dotenv/config'
import { describe, it, expect, vi } from 'vitest'
import { markdown } from './markdown.js'


import { generateText } from 'ai'


describe('markdown function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate markdown with string parameter', async () => {
    const result = await markdown('Write a hello world guide')

    expect(result).toHaveProperty('markdown')
    expect(typeof result.markdown).toBe('string')
    expect(result.markdown.length).toBeGreaterThan(0)
    expect(result).toHaveProperty('mdast')
    expect(result.mdast).toHaveProperty('type', 'root')
    expect(result.mdast).toHaveProperty('children')
    expect(Array.isArray(result.mdast.children)).toBe(true)
  })

  it('should generate markdown with template literal', async () => {
    const topic = 'JavaScript'
    const result = await markdown`Write a comprehensive guide about ${topic}`

    expect(result).toHaveProperty('markdown')
    expect(typeof result.markdown).toBe('string')
    expect(result.markdown.length).toBeGreaterThan(0)
    expect(result).toHaveProperty('mdast')
    expect(result.mdast).toHaveProperty('type', 'root')
  })

  it('should handle template literals with objects', async () => {
    const apiConfig = {
      name: 'User API',
      endpoints: ['GET /users', 'POST /users']
    }

    const result = await markdown`Document the ${apiConfig} API`

    expect(result).toHaveProperty('markdown')
    expect(typeof result.markdown).toBe('string')
    expect(result.markdown.length).toBeGreaterThan(0)
    expect(result).toHaveProperty('mdast')
  })

  it('should parse markdown into proper MDAST structure', async () => {
    const result = await markdown('Generate a code example with JavaScript')

    expect(result.mdast.type).toBe('root')
    expect(result.mdast.children.length).toBeGreaterThan(0)
    
    // Check for common markdown elements in the structure
    const nodeTypes = result.mdast.children.map((child: any) => child.type)
    expect(nodeTypes).toContain('heading')
    
    // Check for code block
    const hasCodeBlock = result.mdast.children.some((child: any) => 
      child.type === 'code' && child.value && child.value.length > 0
    )
    expect(hasCodeBlock).toBe(true)
  })

  it('should throw error for invalid arguments', async () => {
    // Test with invalid arguments (not string or template literal)
    await expect(async () => {
      // @ts-ignore - Testing invalid usage
      await markdown(123)
    }).rejects.toThrow('Function must be called as a template literal or with string and options')
  })

  it('should handle markdown parsing', async () => {
    const result = await markdown('Generate a short paragraph')

    expect(result.markdown).toBeDefined()
    expect(typeof result.markdown).toBe('string')
    expect(result.mdast).toBeDefined()
    expect(result.mdast.type).toBe('root')
    expect(Array.isArray(result.mdast.children)).toBe(true)
  })

  it('should handle complex markdown with multiple elements', async () => {
    const result = await markdown('Generate a complex markdown document with headings, paragraphs, lists, blockquotes, code blocks, and links')

    expect(result.markdown).toBeDefined()
    expect(typeof result.markdown).toBe('string')
    expect(result.markdown.length).toBeGreaterThan(0)
    expect(result.mdast).toBeDefined()
    expect(result.mdast.type).toBe('root')
    expect(result.mdast.children).toBeDefined()
    expect(Array.isArray(result.mdast.children)).toBe(true)

    // Check for various node types in the AST
    const nodeTypes = result.mdast.children.map((child: any) => child.type)
    expect(nodeTypes).toContain('heading')
    expect(nodeTypes).toContain('paragraph')
    
    const hasRichElements = 
      nodeTypes.includes('list') || 
      nodeTypes.includes('blockquote') || 
      nodeTypes.includes('code')
    expect(hasRichElements).toBe(true)
  })
})                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                