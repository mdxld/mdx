import dedent from 'dedent'
import { render } from './render'
import { vi, describe, it, expect } from 'vitest'
import React from 'react'

vi.mock('react-dom/server', () => ({
  renderToString: vi.fn().mockImplementation(() => '<p>Rendered HTML content</p>')
}))

vi.mock('turndown', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      turndown: vi.fn().mockReturnValue('Rendered markdown content')
    }))
  }
})

describe('render', () => {
  it('should render MDX content to markdown', async () => {
    const mdxContent = dedent`
      ---
      title: Test Document
      tags: ['mdx', 'test']
      ---
      
      # Hello World
      
      This is a test MDX document.
    `
    
    const result = await render(mdxContent)
    
    expect(result.markdown).toBe('Rendered markdown content')
    expect(result.frontmatter).toEqual({
      title: 'Test Document',
      tags: ['mdx', 'test']
    })
  })
  
  it('should handle MDX content without frontmatter', async () => {
    const mdxContent = dedent`
      # Hello World
      
      This is a test MDX document without frontmatter.
    `
    
    const result = await render(mdxContent)
    
    expect(result.markdown).toBe('Rendered markdown content')
    expect(result.frontmatter).toEqual({})
  })
  
  it('should pass components and scope to MDX rendering', async () => {
    const mdxContent = dedent`
      # Hello World
      
      <CustomComponent />
    `
    
    const customComponents = {
      CustomComponent: () => React.createElement('div', null, 'Custom content')
    }
    
    const customScope = {
      testVar: 'test value'
    }
    
    const result = await render(mdxContent, {
      components: customComponents,
      scope: customScope
    })
    
    expect(result.markdown).toBe('Rendered markdown content')
  })
  
  it('should throw an error when MDX compilation fails', async () => {
    vi.mock('@mdx-js/mdx', () => ({
      compile: vi.fn().mockRejectedValue(new Error('Compilation error')),
      evaluate: vi.fn()
    }))
    
    const mdxContent = dedent`
      # Invalid MDX
      
      <Component with syntax error
    `
    
    await expect(render(mdxContent)).rejects.toThrow('Failed to render MDX: Compilation error')
  })
})
