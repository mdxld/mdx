import { describe, expect, it, vi, beforeEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'

vi.mock('../../../packages/mdxe/cli/src/utils/execution-context', () => {
  const createMockList = () => {
    const mockItems = ['Item 1', 'Item 2', 'Item 3']
    
    const listFn = async () => mockItems
    
    Object.defineProperty(listFn, Symbol.asyncIterator, {
      value: async function*() {
        for (const item of mockItems) {
          yield item
        }
      }
    })
    
    return listFn
  }
  
  const createMockAi = () => {
    const ai = vi.fn((strings, ...values) => {
      if (strings && 'raw' in strings) {
        const prompt = String.raw({ raw: strings }, ...values)
        return Promise.resolve(`Mock AI response for: ${prompt}`)
      }
      return Promise.resolve('Mock AI response')
    })
    
    Object.defineProperty(ai, 'leanCanvas', {
      value: vi.fn().mockResolvedValue({
        problem: 'Content creation is time-consuming',
        solution: 'AI-powered content generation',
        uniqueValueProposition: 'Save time and improve quality',
        customerSegments: ['Small businesses', 'Content marketers'],
        channels: ['Direct sales', 'Online marketing'],
        revenue: 'Subscription model',
        costs: 'AI API costs, development, marketing'
      })
    })
    
    Object.defineProperty(ai, 'storyBrand', {
      value: vi.fn().mockResolvedValue({
        name: 'ContentAI',
        description: 'AI-powered content generation platform',
        mission: 'Help businesses create better content faster',
        values: 'Efficiency, Quality, Innovation',
        target_audience: 'Small business owners and content marketers',
        tone: 'professional',
        key_messages: [
          'Save 80% of content creation time',
          'Improve content quality with AI assistance'
        ],
        status: 'published'
      })
    })
    
    Object.defineProperty(ai, 'landingPage', {
      value: vi.fn().mockResolvedValue({
        headline: 'Create Better Content 10x Faster with AI',
        subheadline: 'The AI-powered platform for small businesses',
        features: ['AI content generation', 'SEO optimization', 'Brand voice customization'],
        cta: 'Start Free Trial'
      })
    })
    
    return ai
  }
  
  const mockDb = {
    blog: {
      create: vi.fn().mockImplementation((title, content) => Promise.resolve({
        id: title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
        title,
        content,
        date: new Date().toISOString()
      })),
      get: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(true)
    },
    build: vi.fn().mockResolvedValue(true),
    watch: vi.fn().mockResolvedValue(true),
    get: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue([]),
    set: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(true)
  }
  
  return {
    createExecutionContext: vi.fn(() => {
      return {
        ai: createMockAi(),
        
        research: vi.fn(() => Promise.resolve({
          text: 'Mock research results',
          markdown: '# Research Results\n\nMock research results with citations [ ¹ ](#1)\n\n<details id="1">\n<summary>Citation 1</summary>\nhttps://example.com/citation1\n</details>',
          citations: ['https://example.com/citation1'],
          reasoning: 'This is mock reasoning',
          scrapedCitations: [
            {
              url: 'https://example.com/citation1',
              title: 'Example Citation',
              description: 'This is an example citation',
              markdown: '# Example Content\n\nThis is example content from a citation.'
            }
          ]
        })),
        
        list: vi.fn(() => createMockList()),
        
        extract: vi.fn(() => Promise.resolve(['Item 1', 'Item 2', 'Item 3'])),
        
        on: vi.fn((event, callback) => {
          if (event === 'idea.captured') {
            setTimeout(() => callback('AI-powered content generation'), 0)
          }
          return callback
        }),
        
        db: mockDb,
        
        generateText: vi.fn(({ prompt, functionName }) => {
          return Promise.resolve({ text: `Mock response for ${functionName}: ${prompt}` })
        }),
        
        createAiFolderStructure: vi.fn(() => Promise.resolve())
      }
    })
  }
})

import { createExecutionContext } from '../../../packages/mdxe/cli/src/utils/execution-context'

describe('Startups Example Integration', () => {
  const AI_FOLDER = path.join(process.cwd(), '.ai')
  const CACHE_FOLDER = path.join(AI_FOLDER, 'cache')
  const FUNCTIONS_FOLDER = path.join(AI_FOLDER, 'functions')
  
  beforeEach(async () => {
    vi.clearAllMocks()
    
    await fs.mkdir(AI_FOLDER, { recursive: true })
    await fs.mkdir(CACHE_FOLDER, { recursive: true })
    await fs.mkdir(FUNCTIONS_FOLDER, { recursive: true })
    
    const cacheFile = path.join(CACHE_FOLDER, 'example-cache.json')
    await fs.writeFile(cacheFile, JSON.stringify({
      prompt: 'Generate content about AI',
      response: 'Mock AI response for: Generate content about AI',
      timestamp: Date.now()
    }))
  })
  
  it('should create .ai folder structure with function definitions', async () => {
    const context = createExecutionContext('test')
    
    await context.createAiFolderStructure()
    
    const aiExists = await fs.stat(AI_FOLDER).then(() => true).catch(() => false)
    expect(aiExists).toBe(true)
    
    const functionFiles = await fs.readdir(FUNCTIONS_FOLDER)
    expect(functionFiles.length).toBeGreaterThan(0)
  })
  
  it('should generate research results with citations', async () => {
    const context = createExecutionContext('test')
    
    const result = await context.research()
    
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('markdown')
    expect(result).toHaveProperty('citations')
    expect(result).toHaveProperty('scrapedCitations')
    
    expect(result.markdown).toContain('[ ¹ ](#1)')
    expect(result.markdown).toContain('<details id="1">')
  })
  
  it('should generate lists with async iterator support', async () => {
    const context = createExecutionContext('test')
    
    const listFn = context.list()
    const items = await listFn()
    
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
    
    const asyncItems = []
    for await (const item of context.list()) {
      asyncItems.push(item)
    }
    
    expect(asyncItems.length).toBeGreaterThan(0)
  })
  
  it('should generate structured objects with ai.functionName', async () => {
    const context = createExecutionContext('test')
    
    const storyBrand = await context.ai.storyBrand({
      idea: 'AI-powered content generation',
      market: 'Digital Marketing',
      icp: 'Small business owners',
      marketResearch: 'Market is growing at 15% annually'
    })
    
    expect(storyBrand).toHaveProperty('name')
    expect(storyBrand).toHaveProperty('description')
    expect(storyBrand).toHaveProperty('mission')
    expect(storyBrand).toHaveProperty('values')
    expect(storyBrand).toHaveProperty('target_audience')
  })
  
  it('should cache AI responses for improved performance', async () => {
    const context = createExecutionContext('test')
    
    const result1 = await context.ai`Generate content about AI`
    const result2 = await context.ai`Generate content about AI`
    
    expect(result1).toEqual(result2)
    
    const cacheFiles = await fs.readdir(CACHE_FOLDER)
    expect(cacheFiles.length).toBeGreaterThan(0)
  })
  
  it('should execute the full startups workflow', async () => {
    const context = createExecutionContext('test')
    const { on, ai, list, research, db } = context
    
    const blogCreateSpy = vi.spyOn(db.blog, 'create')
    
    await on('idea.captured', async (idea) => {
      expect(idea).toBe('AI-powered content generation')
      
      const listFn = list()
      const markets = await listFn()
      expect(Array.isArray(markets)).toBe(true)
      expect(markets.length).toBeGreaterThan(0)
      const market = markets[0]
      
      const marketResearch = await research()
      expect(marketResearch).toHaveProperty('markdown')
      
      const icpsFn = list()
      const icps = await icpsFn()
      expect(Array.isArray(icps)).toBe(true)
      expect(icps.length).toBeGreaterThan(0)
      const icp = icps[0]
      
      const leanCanvas = await ai.leanCanvas({ idea, market, icp, marketResearch })
      expect(leanCanvas).toBeTruthy()
      
      const storyBrand = await ai.storyBrand({ idea, market, icp, marketResearch, leanCanvas })
      expect(storyBrand).toBeTruthy()
      
      const landingPage = await ai.landingPage({ idea, market, icp, marketResearch, leanCanvas, storyBrand })
      expect(landingPage).toBeTruthy()
      
      const titlesFn = list()
      const titles = await titlesFn()
      expect(Array.isArray(titles)).toBe(true)
      expect(titles.length).toBeGreaterThan(0)
      const title = titles[0]
      
      const content = await ai`write a blog post, starting with "# ${title}"`
      expect(content).toContain(`# ${title}`)
      
      await db.blog.create(title, content)
      expect(blogCreateSpy).toHaveBeenCalledWith(title, content)
      
      const influencers = await research()
      expect(influencers).toHaveProperty('markdown')
      
      const competitors = await research()
      expect(competitors).toHaveProperty('markdown')
    })
  })
})
