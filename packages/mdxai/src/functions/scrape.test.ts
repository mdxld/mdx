import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { scrape, scrapeMultiple } from './scrape'

// Mock FirecrawlApp
vi.mock('@mendable/firecrawl-js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      scrape: vi.fn().mockImplementation(async (url) => {
        if (url.includes('error')) {
          throw new Error('Scraping failed')
        }
        
        const domain = new URL(url).hostname
        
        return {
          url,
          title: `Content from ${domain}`,
          description: `Description from ${domain}`,
          image: 'https://example.com/image.png',
          markdown: '# Test Markdown\nThis is test content',
        }
      })
    }))
  }
})

// Create a mock for fs
vi.mock('fs', () => {
  return {
    readFile: vi.fn().mockImplementation((path, options, callback) => {
      if (typeof options === 'function') {
        options(null, JSON.stringify({ cached: true }))
        return
      }
      if (callback) {
        callback(null, JSON.stringify({ cached: true }))
      }
      return Promise.resolve(JSON.stringify({ cached: true }))
    }),
    writeFile: vi.fn().mockImplementation((path, data, callback) => {
      if (callback) callback(null)
      return Promise.resolve()
    }),
    access: vi.fn().mockImplementation((path, callback) => {
      if (callback) callback(null)
      return Promise.resolve()
    }),
    mkdir: vi.fn().mockImplementation((path, options, callback) => {
      if (typeof options === 'function') {
        options(null)
      } else if (callback) {
        callback(null)
      }
      return Promise.resolve()
    }),
    existsSync: vi.fn().mockReturnValue(true)
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
    
    // First call to cache the result
    const result1 = await scrape(url)
    expect(result1.cached).toBe(false)
    
    // Second call should return cached result
    const result2 = await scrape(url)
    expect(result2.cached).toBe(true)
    expect(result2.url).toBe(url)
    expect(result2.title).toBe('Content from example.com')
  })

  it('should handle scraping errors gracefully', async () => {
    // Mock FirecrawlApp for this test
    const FirecrawlApp = (await import('@mendable/firecrawl-js')).default
    FirecrawlApp.mockImplementationOnce(() => ({
      scrape: vi.fn().mockRejectedValueOnce(new Error('Scraping failed'))
    }))

    const result = await scrape('https://example.com/error')
    
    expect(result).toBeDefined()
    expect(result.url).toBe('https://example.com/error')
    expect(result.error).toBe('Scraping failed')
  })
})

describe('scrapeMultiple', () => {
  beforeEach(() => {
    process.env.FIRECRAWL_API_KEY = 'mock-firecrawl-key'
    process.env.NODE_ENV = 'test'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
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
    
    // Mock FirecrawlApp for this test
    const FirecrawlApp = (await import('@mendable/firecrawl-js')).default
    
    // Create a mock implementation that handles the three URLs differently
    FirecrawlApp.mockImplementationOnce(() => ({
      scrape: vi.fn()
        .mockResolvedValueOnce({
          url: urls[0],
          title: 'Content from example.com',
          description: 'Description from example.com',
          image: 'https://example.com/image.png',
          markdown: '# Test Markdown\nThis is test content',
        })
        .mockRejectedValueOnce(new Error('Scraping failed'))
        .mockResolvedValueOnce({
          url: urls[2],
          title: 'Content from example.org',
          description: 'Description from example.org',
          image: 'https://example.org/image.png',
          markdown: '# Test Markdown\nThis is test content from example.org',
        })
    }))
    
    const results = await scrapeMultiple(urls)
    
    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(urls.length)
    
    expect(results[0].url).toBe(urls[0])
    expect(results[0].title).toBe('Content from example.com')
    
    expect(results[1].url).toBe(urls[1])
    expect(results[1].error).toBe('Scraping failed')
    
    expect(results[2].url).toBe(urls[2])
    expect(results[2].title).toBe('Content from example.org')
  })

  it('should process URLs in parallel with concurrency limit', async () => {
    const urls = Array.from({ length: 10 }, (_, i) => `https://example.com/${i}`)
    
    const results = await scrapeMultiple(urls, 3) // Concurrency of 3
    
    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(urls.length)
    
    for (let i = 0; i < urls.length; i++) {
      expect(results[i].url).toBe(urls[i])
      expect(results[i].title).toBe('Content from example.com')
    }
  })
})
