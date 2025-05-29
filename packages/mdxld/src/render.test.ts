import { render } from './render'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import * as mdx from '@mdx-js/mdx'
import * as ReactDOMServer from 'react-dom/server'
import TurndownService from 'turndown'

vi.mock('@mdx-js/mdx', () => {
  const mockCompile = vi.fn().mockResolvedValue('compiled-mdx-content')
  const mockEvaluate = vi.fn().mockImplementation(() => {
    return Promise.resolve({
      default: () => React.createElement('div', null, 'Mocked MDX Component')
    })
  })
  
  return {
    compile: mockCompile,
    evaluate: mockEvaluate
  }
})

vi.mock('react-dom/server', () => {
  return {
    renderToString: vi.fn().mockReturnValue('<div>Mocked MDX Component</div>')
  }
})

vi.mock('turndown', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      turndown: vi.fn().mockReturnValue('Rendered markdown content')
    }))
  }
})

describe('render', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render MDX content to markdown', async () => {
    const mdxContent = `---
title: Test Document
tags: ["mdx", "test"]
---

# Hello World

This is a test document.`

    const result = await render(mdxContent)

    expect(result.markdown).toBe('Rendered markdown content')
    expect(result.frontmatter).toEqual({
      title: 'Test Document',
      tags: ['mdx', 'test'],
    })
    expect(mdx.compile).toHaveBeenCalled()
    expect(mdx.evaluate).toHaveBeenCalled()
    expect(ReactDOMServer.renderToString).toHaveBeenCalled()
  })

  it('should handle MDX content without frontmatter', async () => {
    const mdxContent = `# Hello World

This is a test document without frontmatter.`

    const result = await render(mdxContent)

    expect(result.markdown).toBe('Rendered markdown content')
    expect(result.frontmatter).toEqual({})
    expect(mdx.compile).toHaveBeenCalled()
  })

  it('should pass components and scope to MDX rendering', async () => {
    const mdxContent = `# Hello World

<CustomComponent />`

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

    expect(result.markdown).toBe('Rendered markdown content')
    expect(mdx.evaluate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      ...customScope
    }))
    expect(ReactDOMServer.renderToString).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          components: customComponents
        })
      })
    )
  })

  it('should throw an error when MDX compilation fails', async () => {
    vi.mocked(mdx.compile).mockRejectedValueOnce(new Error('Compilation error'))

    const mdxContent = `# Invalid MDX

<Component with syntax error />`

    await expect(render(mdxContent)).rejects.toThrow('Failed to render MDX: Compilation error')
  })
})
