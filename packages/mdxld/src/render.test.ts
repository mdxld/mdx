import dedent from 'dedent'
import { render } from './render'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import TurndownService from 'turndown'
import * as mdx from '@mdx-js/mdx'

describe('render', () => {
  it('should render MDX content to markdown', async () => {
    const mdxContent = dedent`
      ---
      title: Test Document
      tags: ["mdx", "test"]
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
  }, 60000) // Increase timeout for real compilation

  it('should handle MDX content without frontmatter', async () => {
    const mdxContent = dedent`
      # Hello World
      
      This is a test MDX document without frontmatter.
    `

    const result = await render(mdxContent)

    expect(result.markdown).toBeTruthy()
    expect(typeof result.markdown).toBe('string')
    expect(result.frontmatter).toEqual({})
  }, 60000) // Increase timeout for real compilation

  it('should pass components and scope to MDX rendering', async () => {
    const mdxContent = dedent`
      # Hello World
      
      This is a test with custom components.
      
      {/* Using JSX syntax that's valid for MDX */}
      <div className="custom">Custom element</div>
    `

    const customComponents = {
      div: (props) => React.createElement('div', props, props.children),
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
    const mdxContent = dedent`
      # Invalid MDX
      
      <Component with syntax error
    `

    await expect(render(mdxContent)).rejects.toThrow()
  }, 60000) // Increase timeout for real compilation
})
