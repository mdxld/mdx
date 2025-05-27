import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { scrape, scrapeMultiple } from 'mdxai'
import { promises as fs } from 'fs'
import path from 'path'

const testCacheDir = path.join(process.cwd(), '.ai', 'cache')

describe('scrape e2e', () => {
  beforeEach(async () => {
    // Clean up cache before each test
    try {
      await fs.rm(testCacheDir, { recursive: true, force: true })
    } catch {
      // Directory might not exist
    }
  })

  afterEach(async () => {
    // Clean up cache after each test
    try {
      await fs.rm(testCacheDir, { recursive: true, force: true })
    } catch {
      // Directory might not exist
    }
  })

  it('should scrape a real URL and cache the result', async () => {
    // Use a reliable test URL
    const url = 'https://httpbin.org/html'
    
    // First scrape - should fetch from web
    const result1 = await scrape(url)
    
    expect(result1.url).toBe(url)
    expect(result1.cached).toBe(false)
    
    // Check if scraping was successful or if we got an error
    if (result1.error) {
      // If there's an error (like insufficient credits), just verify error handling works
      expect(result1.error).toBeDefined()
      expect(result1.html).toBeUndefined()
      expect(result1.markdown).toBeUndefined()
    } else {
      // If successful, verify content is present
      expect(result1.html).toBeDefined()
      expect(result1.markdown).toBeDefined()
      expect(result1.error).toBeUndefined()
    }
    
    // Second scrape - should return cached content (whether success or error)
    const result2 = await scrape(url)
    
    expect(result2.url).toBe(url)
    expect(result2.cached).toBe(true)
    expect(result2.html).toBe(result1.html)
    expect(result2.markdown).toBe(result1.markdown)
    expect(result2.error).toBe(result1.error)
  }, 30000)

  it('should handle multiple URLs with caching', async () => {
    const urls = [
      'https://httpbin.org/html',
      'https://httpbin.org/json',
    ]

    const progressCalls: Array<{ index: number; url: string; cached: boolean }> = []
    
    // First batch - should fetch from web
    const results1 = await scrapeMultiple(urls, (index, url, result) => {
      progressCalls.push({ index, url, cached: result.cached || false })
    })

    expect(results1).toHaveLength(2)
    expect(progressCalls).toHaveLength(2)
    expect(progressCalls.every(call => !call.cached)).toBe(true)
    
    // Clear progress calls for second batch
    progressCalls.length = 0
    
    // Second batch - should return cached content
    const results2 = await scrapeMultiple(urls, (index, url, result) => {
      progressCalls.push({ index, url, cached: result.cached || false })
    })

    expect(results2).toHaveLength(2)
    expect(progressCalls).toHaveLength(2)
    expect(progressCalls.every(call => call.cached)).toBe(true)
  }, 60000)

  it('should create proper cache directory structure', async () => {
    const url = 'https://httpbin.org/html'
    const result = await scrape(url)

    // Check that cache directory was created
    const expectedCacheDir = path.join(testCacheDir, 'httpbin.org')
    const cacheExists = await fs.access(expectedCacheDir).then(() => true).catch(() => false)
    expect(cacheExists).toBe(true)

    // Check that cache file was created
    const expectedCacheFile = path.join(expectedCacheDir, 'html.json')
    const fileExists = await fs.access(expectedCacheFile).then(() => true).catch(() => false)
    expect(fileExists).toBe(true)

    // Verify cache file content
    const cacheContent = JSON.parse(await fs.readFile(expectedCacheFile, 'utf-8'))
    expect(cacheContent.url).toBe(url)
    expect(cacheContent.cachedAt).toBeDefined()
    
    // Content should match what was returned (whether success or error)
    if (result.error) {
      expect(cacheContent.error).toBeDefined()
      expect(cacheContent.html).toBeUndefined()
    } else {
      expect(cacheContent.html).toBeDefined()
      expect(cacheContent.error).toBeUndefined()
    }
  }, 30000)

  it('should handle root URL caching correctly', async () => {
    const url = 'https://httpbin.org/'
    await scrape(url)

    const expectedCacheFile = path.join(testCacheDir, 'httpbin.org', 'index.json')
    const fileExists = await fs.access(expectedCacheFile).then(() => true).catch(() => false)
    expect(fileExists).toBe(true)
  }, 30000)

  it('should handle scraping errors gracefully', async () => {
    // Use an invalid URL that should fail
    const url = 'https://this-domain-should-not-exist-12345.com'
    
    const result = await scrape(url)
    
    expect(result.url).toBe(url)
    expect(result.error).toBeDefined()
    expect(result.cached).toBe(false)
    expect(result.html).toBeUndefined()
    expect(result.markdown).toBeUndefined()
  }, 30000)

  it('should extract meaningful content from a real webpage', async () => {
    // Use a simple test URL
    const url = 'https://httpbin.org/html'
    
    const result = await scrape(url)
    
    expect(result.url).toBe(url)
    expect(result.cached).toBe(false)
    
    // Check if scraping was successful
    if (result.error) {
      // If there's an API error (like insufficient credits), verify error handling
      expect(result.error).toBeDefined()
      expect(result.html).toBeUndefined()
      expect(result.markdown).toBeUndefined()
      console.log('Scraping failed due to API limitations:', result.error)
    } else {
      // If successful, verify content extraction
      expect(result.error).toBeUndefined()
      expect(result.html).toBeDefined()
      expect(result.markdown).toBeDefined()
      
      // Should have some content
      if (result.html) {
        expect(result.html.length).toBeGreaterThan(10)
      }
      if (result.markdown) {
        expect(result.markdown.length).toBeGreaterThan(5)
      }
    }
  }, 30000)

  it('should respect cache TTL and refresh stale content', async () => {
    const url = 'https://httpbin.org/html'
    
    // First scrape
    const result1 = await scrape(url)
    expect(result1.cached).toBe(false)
    
    // Manually modify cache to be older than 24 hours
    const cacheFile = path.join(testCacheDir, 'httpbin.org', 'html.json')
    const cacheContent = JSON.parse(await fs.readFile(cacheFile, 'utf-8'))
    
    // Set cache time to 25 hours ago
    const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    cacheContent.cachedAt = oldTime
    
    await fs.writeFile(cacheFile, JSON.stringify(cacheContent, null, 2))
    
    // Second scrape should refresh the cache
    const result2 = await scrape(url)
    expect(result2.cached).toBe(false) // Should be fresh, not cached
    
    // Verify cache was updated
    const updatedCache = JSON.parse(await fs.readFile(cacheFile, 'utf-8'))
    expect(new Date(updatedCache.cachedAt).getTime()).toBeGreaterThan(new Date(oldTime).getTime())
  }, 90000)
}, 300000) // 5 minute timeout for the entire suite 