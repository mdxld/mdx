import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { scrape, scrapeMultiple, ScrapedContent } from './scrape'
import { promises as fs } from 'fs'
import path from 'path'

// Mock FirecrawlApp
vi.mock('@mendable/firecrawl-js', () => {
  // Create a mock class that matches the FirecrawlApp interface
  const mockScrapeUrl = vi.fn().mockResolvedValue({
    success: true,
    data: {
      metadata: {
        title: 'Test Title',
        description: 'Test Description',
        ogImage: 'https://example.com/image.jpg',
      },
      markdown: '# Test Content\n\nThis is test markdown content.',
      html: '<h1>Test Content</h1><p>This is test HTML content.</p>',
    },
  });
  
  // Create a mock class that matches the FirecrawlApp interface
  class MockFirecrawlApp {
    apiKey: string;
    apiUrl: string;
    version: string;
    
    constructor({ apiKey, apiUrl }: { apiKey?: string | null, apiUrl?: string | null }) {
      this.apiKey = apiKey || 'mock-api-key';
      this.apiUrl = apiUrl || 'https://api.firecrawl.dev';
      this.version = '1.0.0';
    }
    
    scrapeUrl = mockScrapeUrl;
    search = vi.fn();
    crawlUrl = vi.fn();
    asyncCrawlUrl = vi.fn();
    checkCrawlStatus = vi.fn();
    checkCrawlErrors = vi.fn();
    cancelCrawl = vi.fn();
    crawlUrlAndWatch = vi.fn();
    mapUrl = vi.fn();
    batchScrapeUrls = vi.fn();
    asyncBatchScrapeUrls = vi.fn();
    batchScrapeUrlsAndWatch = vi.fn();
    checkBatchScrapeStatus = vi.fn();
    checkBatchScrapeErrors = vi.fn();
    extract = vi.fn();
    asyncExtract = vi.fn();
    getExtractStatus = vi.fn();
    prepareHeaders = vi.fn();
    postRequest = vi.fn();
    getRequest = vi.fn();
    deleteRequest = vi.fn();
    monitorJobStatus = vi.fn();
    handleError = vi.fn();
    deepResearch = vi.fn();
    asyncDeepResearch = vi.fn();
    __deepResearch = vi.fn();
    __asyncDeepResearch = vi.fn();
    checkDeepResearchStatus = vi.fn();
    __checkDeepResearchStatus = vi.fn();
    generateLLMsText = vi.fn();
    asyncGenerateLLMsText = vi.fn();
    checkGenerateLLMsTextStatus = vi.fn();
    agent = vi.fn();
    checkAgentStatus = vi.fn();
    getAgentSession = vi.fn();
    createAgentSession = vi.fn();
    deleteAgentSession = vi.fn();
    listAgentSessions = vi.fn();
    agentChat = vi.fn();
    checkAgentChatStatus = vi.fn();
    getAgentChatHistory = vi.fn();
    clearAgentChatHistory = vi.fn();
    getAgentChatMessage = vi.fn();
    deleteAgentChatMessage = vi.fn();
    getAgentChatMessages = vi.fn();
    getAgentChatMessagesBatch = vi.fn();
    getAgentChatMessagesStream = vi.fn();
    getAgentChatMessagesStreamBatch = vi.fn();
    getAgentChatMessagesStreamAll = vi.fn();
    getAgentChatMessagesStreamAllBatch = vi.fn();
  }
  
  return {
    default: vi.fn().mockImplementation((config) => new MockFirecrawlApp(config))
  };
})

const testCacheDir = path.join(process.cwd(), '.ai', 'cache', 'example.com')

describe('scrape', () => {
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

  it('should scrape a URL and return content', async () => {
    const result = await scrape('https://example.com/test')

    expect(result).toMatchObject({
      url: 'https://example.com/test',
      title: 'Test Title',
      description: 'Test Description',
      image: 'https://example.com/image.jpg',
      markdown: '# Test Content\n\nThis is test markdown content.',
      html: '<h1>Test Content</h1><p>This is test HTML content.</p>',
      cached: false,
    })
  })

  it('should cache scraped content', async () => {
    const url = 'https://example.com/test'
    
    // First scrape
    const result1 = await scrape(url)
    expect(result1.cached).toBe(false)

    // Second scrape should return cached content
    const result2 = await scrape(url)
    expect(result2.cached).toBe(true)
    expect(result2.title).toBe(result1.title)
  })

  it('should handle scraping errors gracefully', async () => {
    // Mock FirecrawlApp to return an error
    const { default: FirecrawlApp } = await import('@mendable/firecrawl-js')
    
    // Create a mock implementation that returns an error for scrapeUrl
    vi.mocked(FirecrawlApp).mockImplementationOnce((config) => {
      const mockApp = new (FirecrawlApp as any)(config);
      // Override the scrapeUrl method to return an error
      mockApp.scrapeUrl = vi.fn().mockResolvedValue({
        success: false,
        error: 'Failed to scrape',
      });
      return mockApp;
    });

    const result = await scrape('https://example.com/error')

    expect(result).toMatchObject({
      url: 'https://example.com/error',
      error: 'Failed to scrape: Failed to scrape',
      cached: false,
    })
  })

  it('should scrape multiple URLs', async () => {
    const urls = [
      'https://example.com/page1',
      'https://example.com/page2',
    ]

    const progressCalls: Array<{ index: number; url: string; result: ScrapedContent }> = []
    
    const results = await scrapeMultiple(urls, (index, url, result) => {
      progressCalls.push({ index, url, result })
    })

    expect(results).toHaveLength(2)
    expect(progressCalls).toHaveLength(2)
    expect(results[0].url).toBe('https://example.com/page1')
    expect(results[1].url).toBe('https://example.com/page2')
  })

  it('should create proper cache file paths', async () => {
    const url = 'https://example.com/path/to/page'
    await scrape(url)

    const expectedPath = path.join(testCacheDir, 'path', 'to', 'page.json')
    const cacheExists = await fs.access(expectedPath).then(() => true).catch(() => false)
    
    expect(cacheExists).toBe(true)
  })

  it('should handle root URL caching', async () => {
    const url = 'https://example.com/'
    await scrape(url)

    const expectedPath = path.join(testCacheDir, 'index.json')
    const cacheExists = await fs.access(expectedPath).then(() => true).catch(() => false)
    
    expect(cacheExists).toBe(true)
  })
})                