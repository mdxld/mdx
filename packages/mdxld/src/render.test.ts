import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'

// Real compilation tests using actual @mdx-js/mdx

describe('render - real compilation', () => {
  it('renders markdown and parses frontmatter', async () => {
    const { render } = await import('./render')
    const mdxContent = `---\ntitle: Real Test\n---\n\n# Hello World`
    const result = await render(mdxContent)
    expect(result.frontmatter).toEqual({ title: 'Real Test' })
    expect(result.markdown).toContain('Hello World')
  })

  it('handles content without frontmatter', async () => {
    const { render } = await import('./render')
    const mdxContent = `# Just Heading`
    const result = await render(mdxContent)
    expect(result.frontmatter).toEqual({})
    expect(result.markdown).toContain('Just Heading')
  })
})

describe('render - mocked mdx', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@mdx-js/mdx', () => {
      const mockEvaluate = vi.fn().mockResolvedValue({
        default: () => React.createElement('div', null, 'Mocked MDX Component'),
      })
      return { evaluate: mockEvaluate }
    })
    vi.doMock('react-dom/server', () => ({
      renderToString: vi.fn().mockReturnValue('<div>Mocked MDX Component</div>'),
    }))
    vi.doMock('turndown', () => ({
      default: vi.fn().mockImplementation(() => ({
        turndown: vi.fn().mockReturnValue('Rendered markdown content'),
      })),
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns markdown using mocks', async () => {
    const { render } = await import('./render')
    const mdxContent = `# Test`
    const result = await render(mdxContent)
    expect(result.markdown).toBe('Rendered markdown content')
  })

  it('throws an error when evaluation fails', async () => {
    vi.mocked((await import('@mdx-js/mdx')).evaluate).mockRejectedValueOnce(new Error('Compilation error'))
    const { render } = await import('./render')
    await expect(render('# Error')).rejects.toThrow('Failed to render MDX: Compilation error')
  })
})
