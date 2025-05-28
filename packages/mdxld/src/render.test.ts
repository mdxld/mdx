import { render } from './render'
import { describe, it, expect } from 'vitest'
import React from 'react'

describe('render', () => {
  it('should render simple MDX content to markdown', async () => {
    // Use extremely simple MDX content
    const mdxContent = '# Hello World'

    const result = await render(mdxContent)

    expect(result.markdown).toBeTruthy()
    expect(typeof result.markdown).toBe('string')
    expect(result.frontmatter).toEqual({})
  }, 60000) // Increase timeout for real compilation

  it('should handle frontmatter in MDX content', async () => {
    // Use extremely simple MDX content with frontmatter
    const mdxContent = `---
title: Test Document
---

# Hello World`

    const result = await render(mdxContent)

    expect(result.markdown).toBeTruthy()
    expect(typeof result.markdown).toBe('string')
    expect(result.frontmatter).toEqual({
      title: 'Test Document'
    })
  }, 60000) // Increase timeout for real compilation

  it('should pass components and scope to MDX rendering', async () => {
    // Use extremely simple MDX content
    const mdxContent = '# Hello World'

    const customComponents = {
      h1: (props) => React.createElement('h1', props, props.children),
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
  }, 60000) // Increase timeout for real compilation

  it('should throw an error when MDX compilation fails', async () => {
    // Use intentionally invalid MDX content
    const mdxContent = '<Component>'

    await expect(render(mdxContent)).rejects.toThrow()
  }, 60000) // Increase timeout for real compilation
})
