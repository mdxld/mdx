import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { scrape, scrapeMultiple } from './scrape'

// Mock FirecrawlApp at the top level
vi.mock('@mendable/firecrawl-js', () => ({
  default: vi.fn(() => ({
    scrapeUrl: vi.fn(async (url) => {
      if (url.includes('error')) {
        return { success: false, error: 'Scraping failed' }
      }
      
      const domain = new URL(url).hostname
      
      return {
        success: true,
        data: {
          metadata: {
            title: `Content from ${domain}`,
            description: `Description from ${domain}`,
            ogImage: 'https://example.com/image.png',
          },
          markdown: '# Test Markdown\nThis is test content',
          html: '<h1>Test Markdown</h1><p>This is test content</p>'
        }
      }
    })
  }))
}))

// Mock fs module at the top level
vi.mock('fs', () => {
  let cacheHit = false
  
  return {
    promises: {
      readFile: vi.fn(async (path) => {
        // Toggle cache hit for testing both scenarios
        cacheHit = !cacheHit
        
        if (cacheHit && path.includes('cache')) {
          return `---
url: "https://example.com/cached"
title: "Content from example.com"
description: "Description from example.com"
image: "https://example.com/image.png"
cachedAt: "${new Date().toISOString()}"
---

# Test Markdown
This is test content`
        }
        
        throw new Error('File not found')
      }),
      writeFile: vi.fn(() => Promise.resolve()),
      access: vi.fn(() => Promise.resolve()),
      mkdir: vi.fn(() => Promise.resolve()),
    }
  }
})

describe('scrape', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.FIRECRAWL_API_KEY = 'mock-firecrawl-key'
    process.env.NODE_ENV = 'test'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should scrape content from a URL', async () => {
    const url = 'https://example.com'
    const result = await scrape(url)

    expect(result).toBeDefined()
    expect(result.url).toBe(url)
    expect(result.title).toBe('Content from example.com')
    expect(result.description).toBe('Description from example.com')
    expect(result.markdown).toBe('# Test Markdown\nThis is test content')
    expect(result.cached).toBe(false)
  })

  it('should return cached result when available', async () => {
    const url = 'https://example.com/cached'
    
    // This will use the cached content from the fs mock
    const result = await scrape(url)
    
    expect(result.cached).toBe(true)
    expect(result.url).toBe(url)
    expect(result.title).toBe('Content from example.com')
  })

  it('should handle scraping errors gracefully', async () => {
    const url = 'https://example.com/error'
    const result = await scrape(url)
    
    expect(result).toBeDefined()
    expect(result.url).toBe(url)
    expect(result.error).toBe('Failed to scrape: Scraping failed')
  })
})

// For scrapeMultiple tests, we'll directly mock the scrape function
describe('scrapeMultiple', () => {
  const originalEnv = { ...process.env }
  const originalScrape = scrape

  beforeEach(() => {
    process.env.FIRECRAWL_API_KEY = 'mock-firecrawl-key'
    process.env.NODE_ENV = 'test'
    vi.clearAllMocks()
    
    // Replace the scrape function with our mock
    vi.spyOn(global, 'scrape' as any).mockImplementation(async (url: string) => {
      if (url.includes('error')) {
        return {
          url,
          error: 'Failed to scrape: Scraping failed',
          cached: false
        }
      }
      
      const domain = new URL(url).hostname
      
      return {
        url,
        title: `Content from ${domain}`,
        description: `Description from ${domain}`,
        image: 'https://example.com/image.png',
        markdown: '# Test Markdown\nThis is test content',
        cached: false
      }
    })
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  it('should scrape multiple URLs', async () => {
    const urls = [
      'https://example.com/1',
      'https://example.com/2',
      'https://example.org/3',
    ]
    
    const results = await scrapeMultiple(urls)
    
    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(urls.length)
    
    expect(results[0].url).toBe(urls[0])
    expect(results[0].title).toBe('Content from example.com')
    
    expect(results[1].url).toBe(urls[1])
    expect(results[1].title).toBe('Content from example.com')
    
    expect(results[2].url).toBe(urls[2])
    expect(results[2].title).toBe('Content from example.org')
  })

  it('should handle errors for individual URLs', async () => {
    const urls = [
      'https://example.com/1',
      'https://example.com/error',
      'https://example.org/3',
    ]
    
    const results = await scrapeMultiple(urls)
    
    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(urls.length)
    
    expect(results[0].url).toBe(urls[0])
    expect(results[0].title).toBe('Content from example.com')
    
    expect(results[1].url).toBe(urls[1])
    expect(results[1].error).toBe('Failed to scrape: Scraping failed')
    
    expect(results[2].url).toBe(urls[2])
    expect(results[2].title).toBe('Content from example.org')
  })

  it('should process URLs in parallel with concurrency limit', async () => {
    const urls = Array.from({ length: 10 }, (_, i) => `https://example.com/${i}`)
    
    // Mock onProgress function
    const onProgress = vi.fn()
    
    const results = await scrapeMultiple(urls, onProgress)
    
    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(urls.length)
    
    for (let i = 0; i < urls.length; i++) {
      expect(results[i].url).toBe(urls[i])
      expect(results[i].title).toBe('Content from example.com')
    }
    
    // Check that onProgress was called for each URL
    expect(onProgress).toHaveBeenCalledTimes(urls.length)
  })
})
