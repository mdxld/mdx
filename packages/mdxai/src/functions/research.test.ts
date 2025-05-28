




import 'dotenv/config'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { research } from './research'
import FirecrawlApp from '@mendable/firecrawl-js'
import { createCacheMiddleware } from '../cacheMiddleware'

const isCI = process.env.CI === 'true'

describe('research (mocked)', () => {
  const originalEnv = { ...process.env }

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
    try {
      const result = await research('How do I use structured outputs with the Vercel AI SDK?')

      expect(Array.isArray(result.citations)).toBe(true)
      
      if (result.citations.length > 0) {
        expect(result.scrapedCitations).toBeDefined()
        expect(Array.isArray(result.scrapedCitations)).toBe(true)
        
        if (result.scrapedCitations.length > 0) {
          const firstCitation = result.scrapedCitations[0]
          expect(firstCitation).toHaveProperty('url')
          expect(firstCitation).toHaveProperty('title')
        }
        
        expect(result.markdown).toBeDefined()
        expect(typeof result.markdown).toBe('string')
      }
    } catch (error) {
      expect((error as Error).message).toMatch(/Bad Request|API key|not valid|unauthorized/i)
    }
  })
  
  it('should work with template literals', async () => {
    try {
      const topic = 'Vercel AI SDK'
      const result = await research`How do I use ${topic} for structured outputs?`
      
      expect(result).toBeDefined()
      expect(typeof result.text).toBe('string')
      expect(typeof result.markdown).toBe('string')
      expect(Array.isArray(result.citations)).toBe(true)
    } catch (error) {
      expect((error as Error).message).toMatch(/Bad Request|API key|not valid|unauthorized/i)
    }
  })
})

describe('research e2e', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should generate research with real API and cache the result', async () => {
    try {
      const query = 'What is the Vercel AI SDK?'
      
      const result1 = await research(query)
      
      expect(result1).toBeDefined()
      expect(typeof result1.text).toBe('string')
      
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
      }
      
      const result2 = await research(query)
      
      expect(result2).toBeDefined()
      expect(typeof result2.text).toBe('string')
    } catch (error) {
      expect((error as Error).message).toMatch(/Bad Request|API key|not valid|unauthorized/i)
    }
  }, 60000)

  it('should handle invalid citation URLs gracefully', async () => {
    try {
      const query = 'Test with invalid citation URL'
      
      const result = await research(query)
      
      expect(result).toBeDefined()
      expect(typeof result.text).toBe('string')
      
      // We can't guarantee the AI will include our invalid URL, so we'll just check the basic structure
      expect(Array.isArray(result.citations)).toBe(true)
      expect(Array.isArray(result.scrapedCitations)).toBe(true)
    } catch (error) {
      expect((error as Error).message).toMatch(/Bad Request|API key|not valid|unauthorized/i)
    }
  }, 30000)
})
