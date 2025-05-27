import dedent from 'dedent'
import { render } from './render'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import TurndownService from 'turndown'
import * as mdx from '@mdx-js/mdx'

vi.mock('@mdx-js/mdx', () => {
  return {
    compile: vi.fn().mockResolvedValue('compiled-mdx-content'),
    evaluate: vi.fn().mockResolvedValue({
      default: () => React.createElement('div', null, 'Mocked MDX Component')
    })
  }
})

vi.mock('turndown', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      turndown: vi.fn().mockReturnValue('Rendered markdown content')
    }))
  }
})

vi.mock('react-dom/server', () => {
  return {
    renderToString: vi.fn().mockReturnValue('<div>Mocked MDX Component</div>')
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

    expect(result.markdown).toBeTruthy()
    expect(typeof result.markdown).toBe('string')
    expect(result.frontmatter).toEqual({
      title: 'Test Document',
      tags: ['mdx', 'test'],
    })
  })

  it('should handle MDX content without frontmatter', async () => {
    const mdxContent = dedent`
      # Hello World
      
      This is a test MDX document without frontmatter.
    `

    const result = await render(mdxContent)

    expect(result.markdown).toBeTruthy()
    expect(typeof result.markdown).toBe('string')
    expect(result.frontmatter).toEqual({})
  })

  it('should pass components and scope to MDX rendering', async () => {
    const mdxContent = dedent`
      # Hello World
      
      <CustomComponent />
    `

    const customComponents = {
      CustomComponent: () => React.createElement('div', null, 'Custom content'),
    }

    const customScope = {
      testVar: 'test value',
    }

    const result = await render(mdxContent, {
      components: customComponents,
      scope: customScope,
    })

    expect(result.markdown).toBeTruthy()
    expect(typeof result.markdown).toBe('string')
  })

  it('should throw an error when MDX compilation fails', async () => {
    vi.mocked(mdx.compile).mockRejectedValueOnce(new Error('Compilation error'))

    const mdxContent = dedent`
      # Invalid MDX
      
      <Component with syntax error
    `

    await expect(render(mdxContent)).rejects.toThrow('Failed to render MDX: Compilation error')
  })
})
