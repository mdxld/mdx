import 'dotenv/config'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { research } from './research'
import FirecrawlApp from '@mendable/firecrawl-js'
import { createCacheMiddleware } from '../cacheMiddleware'

// Mock modules at the top level
vi.mock('ai', () => {
  return {
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
  }
})

vi.mock('./scrape', () => {
  return {
    scrape: vi.fn().mockImplementation((url) => {
      const domain = new URL(url).hostname
      
      return Promise.resolve({
        url,
        title: `Content from ${domain}`,
        description: `Description from ${domain}`,
        image: 'https://example.com/image.png',
        markdown: '# Test Markdown\nThis is test content',
        cached: false
      })
    }),
    ScrapedContent: class {}
  }
})

const isCI = process.env.CI === 'true'

const originalEnv = { ...process.env }

const cacheMiddleware = createCacheMiddleware({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 100,
  persistentCache: true,
  memoryCache: true,
})

describe('research (mocked)', () => {
  beforeEach(() => {
    process.env.AI_GATEWAY_TOKEN = 'mock-token'
    process.env.FIRECRAWL_API_KEY = 'mock-firecrawl-key'
    process.env.NODE_ENV = 'test'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
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
    expect(result.markdown).toContain('ai-sdk.dev')
    expect(result.markdown).toContain('vercel.com')
  })
})

// Skip e2e tests in CI environment
describe.skipIf(isCI)('research e2e', () => {
  beforeEach(() => {
    if (!process.env.AI_GATEWAY_TOKEN && !process.env.OPENAI_API_KEY) {
      console.log('Skipping research e2e test: AI_GATEWAY_TOKEN or OPENAI_API_KEY not set')
      return
    }
    
    if (!process.env.FIRECRAWL_API_KEY) {
      console.log('Skipping research e2e test: FIRECRAWL_API_KEY not set')
      return
    }
    
    process.env.NODE_ENV = 'development'
    
    // Restore original modules for e2e tests
    vi.restoreAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should generate research with real API and cache the result', async () => {
    if ((!process.env.AI_GATEWAY_TOKEN && !process.env.OPENAI_API_KEY) || !process.env.FIRECRAWL_API_KEY) {
      return
    }

    const query = 'What is the Vercel AI SDK?'
    
    const result1 = await research(query)
    
    expect(result1).toBeDefined()
    expect(typeof result1.text).toBe('string')
    expect(result1.text.length).toBeGreaterThan(0)
    
    if (result1.citations && result1.citations.length > 0) {
      expect(Array.isArray(result1.citations)).toBe(true)
      expect(result1.scrapedCitations).toBeDefined()
      expect(Array.isArray(result1.scrapedCitations)).toBe(true)
      
      if (result1.scrapedCitations.length > 0) {
        const firstCitation = result1.scrapedCitations[0]
        expect(firstCitation).toHaveProperty('url')
        expect(firstCitation).toHaveProperty('title')
      }
      
      expect(result1.markdown).toBeDefined()
      expect(typeof result1.markdown).toBe('string')
      expect(result1.markdown.length).toBeGreaterThan(0)
    }
    
    const result2 = await research(query)
    
    expect(result2.text).toBe(result1.text)
    expect(result2.citations).toEqual(result1.citations)
    expect(result2.reasoning).toBe(result1.reasoning)
  }, 60000)

  it('should handle errors gracefully with real API', async () => {
    if ((!process.env.AI_GATEWAY_TOKEN && !process.env.OPENAI_API_KEY) || !process.env.FIRECRAWL_API_KEY) {
      return
    }

    const query = ''
    
    try {
      const result = await research(query)
      
      expect(result).toBeDefined()
      expect(typeof result.text).toBe('string')
      
      expect(Array.isArray(result.citations)).toBe(true)
    } catch (error: any) {
      expect(error.message).toBeDefined()
    }
  }, 30000)

  it('should handle invalid citation URLs gracefully', async () => {
    if ((!process.env.AI_GATEWAY_TOKEN && !process.env.OPENAI_API_KEY) || !process.env.FIRECRAWL_API_KEY) {
      return
    }

    // This test would normally use a custom mock, but since we're testing with real APIs,
    // we'll just use a URL that's likely to be invalid
    const query = 'Test with invalid citation URL that points to https://this-domain-should-not-exist-12345.com'
    
    const result = await research(query)
    
    expect(result).toBeDefined()
    expect(typeof result.text).toBe('string')
    expect(result.text.length).toBeGreaterThan(0)
    
    // We can't guarantee the AI will include our invalid URL, so we'll just check the basic structure
    expect(Array.isArray(result.citations)).toBe(true)
    expect(Array.isArray(result.scrapedCitations)).toBe(true)
  }, 30000)
})
