import 'dotenv/config'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { research } from './research'
import FirecrawlApp from '@mendable/firecrawl-js'
import { generateText } from 'ai'
import hash from 'object-hash'

const isCI = process.env.CI === 'true'

const originalEnv = { ...process.env }

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: 'This is a test response with citation [1] and another citation [2].',
    response: {
      body: {
        citations: ['https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data', 'https://vercel.com/docs/ai-sdk'],
        choices: [
          {
            message: {
              reasoning: 'This is mock reasoning',
            },
          },
        ],
      },
    },
  }),
  model: vi.fn().mockReturnValue('mock-model'),
}))

vi.mock('@mendable/firecrawl-js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      scrapeUrl: vi.fn().mockResolvedValue({
        success: true,
        data: {
          markdown: '# Test Markdown\nThis is test content',
          html: '<h1>Test HTML</h1><p>This is test content</p>',
          metadata: {
            title: 'Test Title',
            description: 'Test Description',
            ogImage: 'https://example.com/image.png',
          },
        },
      }),
    })),
  }
})

vi.mock('../cacheMiddleware.js', () => ({
  createCacheMiddleware: vi.fn().mockReturnValue({
    wrapGenerate: vi.fn().mockImplementation(({ doGenerate }) => doGenerate()),
    wrapStream: vi.fn().mockImplementation(({ doStream }) => doStream()),
  }),
}))

vi.mock('object-hash', () => ({
  default: vi.fn().mockReturnValue('mock-hash-key'),
}))

describe('research', () => {
  beforeEach(() => {
    process.env.AI_GATEWAY_TOKEN = 'mock-token'
    process.env.FIRECRAWL_API_KEY = 'mock-firecrawl-key'
    process.env.NODE_ENV = 'test'
    process.env.VITEST = 'true'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  it('should process citations and create enhanced markdown', async () => {
    const result = await research('How do I use structured outputs with the Vercel AI SDK?')

    expect(Array.isArray(result.citations)).toBe(true)
    expect(result.citations).toEqual(['https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data', 'https://vercel.com/docs/ai-sdk'])

    expect(result.scrapedCitations).toBeDefined()
    expect(Array.isArray(result.scrapedCitations)).toBe(true)
    expect(result.scrapedCitations.length).toBe(result.citations.length)

    const firstCitation = result.scrapedCitations[0]
    expect(firstCitation).toHaveProperty('url')
    expect(firstCitation).toHaveProperty('title')
    expect(firstCitation).toHaveProperty('description')
    expect(firstCitation).toHaveProperty('markdown')

    expect(result.markdown).toContain('[ ¹ ](#1)')
    expect(result.markdown).toContain('[ ² ](#2)')

    expect(result.markdown).toContain('<details id="1">')
    expect(result.markdown).toContain('<summary>')
    expect(result.markdown).toContain('Test Title')
    expect(result.markdown).toContain('Test Description')
  })

  it('should support multi-source research aggregation', async () => {
    const result = await research('AI developments', { 
      sources: ['web', 'academic', 'social'],
      qualityThreshold: 0.5 
    })

    expect(result.aggregatedSources).toEqual(['web', 'academic', 'social'])
    expect(result.averageQualityScore).toBeGreaterThanOrEqual(0)
    expect(result.scrapedCitations.every(c => (c.qualityScore || 0) >= 0.5)).toBe(true)
  })

  it('should apply quality filtering', async () => {
    const result = await research('test query', { 
      qualityThreshold: 0.8 
    })

    expect(result.scrapedCitations.every(c => (c.qualityScore || 0) >= 0.8)).toBe(true)
  })

  it('should maintain backward compatibility', async () => {
    const legacyResult = await research('test query')
    
    expect(legacyResult).toHaveProperty('text')
    expect(legacyResult).toHaveProperty('markdown')
    expect(legacyResult).toHaveProperty('citations')
    expect(legacyResult).toHaveProperty('scrapedCitations')
  })

  it('should use caching when enabled', async () => {
    const result1 = await research('cached query', { 
      cacheOptions: { enabled: true, ttl: 60000 } 
    })
    const result2 = await research('cached query', { 
      cacheOptions: { enabled: true, ttl: 60000 } 
    })

    expect(hash).toHaveBeenCalledWith(expect.objectContaining({ query: 'cached query' }))
  })
})
