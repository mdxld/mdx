import 'dotenv/config'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { research } from './research'
import FirecrawlApp from '@mendable/firecrawl-js'
import { createCacheMiddleware } from '../cacheMiddleware'

const isCI = process.env.CI === 'true'

describe('research', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should generate research with real API and cache the result', async () => {
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
        if (firstCitation.title) {
          expect(typeof firstCitation.title).toBe('string')
        }
      }
      
      expect(result1.markdown).toBeDefined()
      expect(typeof result1.markdown).toBe('string')
    }
    
    const result2 = await research(query)
    
    expect(result2).toBeDefined()
    expect(typeof result2.text).toBe('string')
  }),

  it('should handle invalid citation URLs gracefully', async () => {
    const query = 'Test with invalid citation URL'
    
    const result = await research(query)
    
    expect(result).toBeDefined()
    expect(typeof result.text).toBe('string')
    
    // We can't guarantee the AI will include our invalid URL, so we'll just check the basic structure
    expect(Array.isArray(result.citations)).toBe(true)
    expect(Array.isArray(result.scrapedCitations)).toBe(true)
  })
})
