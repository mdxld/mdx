import 'dotenv/config'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

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
});

vi.mock('../src/ai.js', () => ({
  model: vi.fn().mockReturnValue('mock-model'),
}));

vi.mock('yaml', () => ({
  default: {
    stringify: vi.fn().mockReturnValue('mocked yaml string')
  },
  stringify: vi.fn().mockReturnValue('mocked yaml string')
}));

vi.mock('@mendable/firecrawl-js', () => ({
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
    apiKey: 'mock-key',
    apiUrl: 'https://api.example.com',
    version: '1.0.0',
    isCloudService: true,
  })),
}));

vi.mock('../src/ui/index.js', () => ({
  QueueManager: vi.fn().mockImplementation(() => ({
    addTask: vi.fn().mockImplementation((name, task) => task()),
  })),
}));

import FirecrawlApp from '@mendable/firecrawl-js'
import { generateText } from 'ai'
import yaml from 'yaml'
import { research } from '../src/functions/research.js'

describe('research function', () => {
  const originalEnv = { ...process.env }
  
  beforeEach(() => {
    process.env.AI_GATEWAY_TOKEN = 'mock-token'
    process.env.FIRECRAWL_API_KEY = 'mock-firecrawl-key'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  describe('citation processing', () => {
    it('should process query strings with variables', async () => {
      const market = 'AI tools'
      const idea = 'AI-powered content generation'
      const query = `${market} in the context of delivering ${idea}`
      
      const result = await research(query)

      expect(generateText).toHaveBeenCalled()
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('markdown')
      expect(result).toHaveProperty('citations')
    })

    it('should handle simple string queries', async () => {
      const result = await research('AI market research')
      
      expect(generateText).toHaveBeenCalled()
      expect(result).toHaveProperty('text')
    })
  })

  describe('markdown generation', () => {
    it('should stringify arrays to YAML format', async () => {
      const competitors = ['Company A', 'Company B', 'Company C']
      const query = `Competitors: ${yaml.stringify(competitors)}`
      
      const result = await research(query)

      expect(generateText).toHaveBeenCalled()
      expect(result).toHaveProperty('markdown')
    })

    it('should stringify objects to YAML format', async () => {
      const marketData = {
        size: '$5 billion',
        growth: '12% annually',
        topPlayers: ['Company X', 'Company Y', 'Company Z'],
        regions: {
          northAmerica: '40%',
          europe: '30%',
          asia: '25%',
          other: '5%',
        },
      }

      const query = `Market analysis: ${yaml.stringify(marketData)}`
      const result = await research(query)

      expect(generateText).toHaveBeenCalled()
      expect(result).toHaveProperty('markdown')
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      vi.mocked(generateText).mockRejectedValueOnce(new Error('API error'))
      
      await expect(research('Test with API error')).rejects.toThrow('API error')
    })
    
    it('should handle scraping errors gracefully', async () => {
      const mockFirecrawlInstance = vi.mocked(FirecrawlApp).mock.results[0]?.value
      
      if (mockFirecrawlInstance) {
        const originalScrapeUrl = mockFirecrawlInstance.scrapeUrl
        
        mockFirecrawlInstance.scrapeUrl = vi.fn().mockRejectedValueOnce(new Error('Scraping error'))
        
        const result = await research('Test with scraping error')
        
        expect(result).toHaveProperty('text')
        expect(result).toHaveProperty('markdown')
        expect(result.citations).toEqual(['https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data', 'https://vercel.com/docs/ai-sdk'])
        
        mockFirecrawlInstance.scrapeUrl = originalScrapeUrl
      }
    })
  })
})
