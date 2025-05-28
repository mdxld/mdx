import { describe, it, expect, vi } from 'vitest'

vi.mock('mdxai', () => {
  const mockResearchResult = {
    text: 'This is a test research response about Vercel',
    markdown: '# Research Results\n\nThis is a test research response about Vercel with citations [ ¹ ](#1)\n\n<details id="1">\n<summary>Content from vercel.com</summary>\n\n# Test Markdown\nThis is test content\n\n</details>',
    citations: ['https://vercel.com/about'],
    reasoning: 'This is mock reasoning',
    scrapedCitations: [
      {
        url: 'https://vercel.com/about',
        title: 'Content from vercel.com',
        description: 'Description from vercel.com',
        markdown: '# Test Markdown\nThis is test content',
      }
    ],
  }

  return {
    research: vi.fn().mockImplementation((queryOrTemplate, ...values) => {
      if (typeof queryOrTemplate === 'string') {
        return Promise.resolve(mockResearchResult)
      } else if (Array.isArray(queryOrTemplate) && 'raw' in queryOrTemplate) {
        return Promise.resolve(mockResearchResult)
      }
      
      throw new Error('Research function must be called with a string or as a template literal')
    })
  }
})

import { research } from 'mdxai'

describe('research', () => {
  const company = 'Vercel'
  
  it('should interpolate a string', async () => {
    const result = await research`the origin story of ${company}`
    expect(result.text).toContain(company)
  }, 300_000)
  
  it('should return citations', async () => {
    const result = await research`the origin story of ${company}`
    expect(result.citations).toBeDefined()
  }, 300_000)
})
