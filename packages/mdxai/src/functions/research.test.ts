import 'dotenv/config'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { research } from './research'
import FirecrawlApp from '@mendable/firecrawl-js'
import * as ai from 'ai'
import * as scrapeModule from './scrape'
import { createCacheMiddleware } from '../cacheMiddleware'

// Import the actual modules but don't mock them directly
// Instead create mock functions that we'll use in the tests

const isCI = process.env.CI === 'true'

const originalEnv = { ...process.env }

const cacheMiddleware = createCacheMiddleware({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 100,
  persistentCache: true,
  memoryCache: true,
})

// Create mock functions without using vi.mock
const generateTextMock = vi.fn().mockResolvedValue({
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
})

// Create mock functions without using vi.mock
const scrapeMock = vi.fn().mockImplementation((url) => {
  const domain = new URL(url).hostname
  
  return Promise.resolve({
    url,
    title: `Content from ${domain}`,
    description: `Description from ${domain}`,
    image: 'https://example.com/image.png',
    markdown: '# Test Markdown\nThis is test content',
    cached: false
  })
})

describe('research (mocked)', () => {
  beforeEach(() => {
    process.env.AI_GATEWAY_TOKEN = 'mock-token'
    process.env.FIRECRAWL_API_KEY = 'mock-firecrawl-key'
    process.env.NODE_ENV = 'test'
    
    // Use vi.fn() to create a new function that calls our mock
    vi.spyOn(ai, 'generateText').mockImplementation((...args) => generateTextMock(...args))
    vi.spyOn(scrapeModule, 'scrape').mockImplementation((...args) => scrapeMock(...args))
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
    vi.restoreAllMocks()
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

describe('research e2e', () => {
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
    vi.clearAllMocks()
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

    // Create a custom mock for this test
    const customMock = vi.fn().mockResolvedValueOnce({
      text: 'This is a test response with invalid citation [1].',
      response: {
        body: {
          citations: ['https://this-domain-should-not-exist-12345.com'],
          choices: [
            {
              message: {
                reasoning: 'Test reasoning',
              },
            },
          ],
        },
      },
    } as any)
    
    // Use vi.spyOn to temporarily replace the implementation
    const spy = vi.spyOn(ai, 'generateText').mockImplementation(() => customMock())
    
    const query = 'Test with invalid citation URL'
    const result = await research(query)
    
    expect(result).toBeDefined()
    expect(typeof result.text).toBe('string')
    expect(result.text.length).toBeGreaterThan(0)
    
    expect(Array.isArray(result.citations)).toBe(true)
    expect(result.citations).toContain('https://this-domain-should-not-exist-12345.com')
    
    expect(Array.isArray(result.scrapedCitations)).toBe(true)
    
    // Restore the original implementation
    spy.mockRestore()
  }, 30000)
})
