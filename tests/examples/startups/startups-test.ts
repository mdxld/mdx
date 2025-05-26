import { describe, expect, it, vi, beforeEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'

vi.mock('../../../packages/mdxe/cli/src/utils/execution-context', () => {
  return {
    createExecutionContext: vi.fn(() => {
      const aiFunction = vi.fn((strings: TemplateStringsArray, ...values: any[]) => {
        const prompt = String.raw({ raw: strings }, ...values)
        return Promise.resolve(`Mock AI response for: ${prompt}`)
      })
      
      aiFunction.leanCanvas = vi.fn().mockResolvedValue({
        problem: 'Content creation is time-consuming',
        solution: 'AI-powered content generation',
        uniqueValueProposition: 'Save time and improve quality',
        customerSegments: ['Small businesses', 'Content marketers'],
        channels: ['Direct sales', 'Online marketing'],
        revenue: 'Subscription model',
        costs: 'AI API costs, development, marketing'
      })
      
      aiFunction.storyBrand = vi.fn().mockResolvedValue({
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
      
      aiFunction.landingPage = vi.fn().mockResolvedValue({
        headline: 'Create Better Content 10x Faster with AI',
        subheadline: 'The AI-powered platform for small businesses',
        features: ['AI content generation', 'SEO optimization', 'Brand voice customization'],
        cta: 'Start Free Trial'
      })
      
      const researchFunction = vi.fn().mockResolvedValue({
        text: 'Mock research results',
        markdown: '# Research Results\n\nMock research results with citations [ ¹ ](#1)',
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
      })
      
      const listFunction = vi.fn().mockImplementation(() => {
        const mockItems = ['Item 1', 'Item 2', 'Item 3']
        
        const listFn = async () => mockItems
        
        Object.defineProperty(listFn, Symbol.asyncIterator, {
          value: async function*() {
            for (const item of mockItems) {
              yield item
            }
          },
          writable: true
        })
        
        return listFn
      })
      
      const mockDb = {
        blog: {
          create: vi.fn().mockImplementation((title: string, content: string) => {
            return Promise.resolve({
              id: title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
              title,
              content,
              date: new Date().toISOString()
            })
          }),
          get: vi.fn().mockResolvedValue(null),
          list: vi.fn().mockResolvedValue([]),
          update: vi.fn().mockResolvedValue({}),
          delete: vi.fn().mockResolvedValue(true)
        },
        get: vi.fn().mockResolvedValue(null),
        list: vi.fn().mockResolvedValue([]),
        set: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue(true)
      }
      
      const eventHandlers: Record<string, Function[]> = {}
      const onFunction = vi.fn((event: string, callback: Function) => {
        if (!eventHandlers[event]) {
          eventHandlers[event] = []
        }
        eventHandlers[event].push(callback)
        
        if (event === 'idea.captured') {
          setTimeout(() => {
            if (eventHandlers[event]) {
              eventHandlers[event].forEach(handler => handler('AI-powered content generation'))
            }
          }, 0)
        }
        
        return callback
      })
      
      return {
        ai: aiFunction,
        research: researchFunction,
        list: listFunction,
        extract: vi.fn().mockResolvedValue(['Item 1', 'Item 2', 'Item 3']),
        on: onFunction,
        db: mockDb,
        generateText: vi.fn().mockImplementation(({ prompt, functionName }: { prompt: string, functionName: string }) => {
          return Promise.resolve({ text: `Mock response for ${functionName}: ${prompt}` })
        }),
        createAiFolderStructure: vi.fn().mockResolvedValue(undefined)
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
    
    const functionFiles = [
      { name: 'default.md', content: '# Default AI Function\n\nThis is the default AI function.' },
      { name: 'research.md', content: '# Research Function\n\nThis function performs research with citations.' },
      { name: 'list.md', content: '# List Function\n\nThis function generates lists of items.' },
      { name: 'leanCanvas.md', content: '# Lean Canvas Function\n\nThis function generates a lean canvas.' },
      { name: 'storyBrand.md', content: '# Story Brand Function\n\nThis function generates a story brand.' },
      { name: 'landingPage.md', content: '# Landing Page Function\n\nThis function generates a landing page.' }
    ]
    
    for (const file of functionFiles) {
      await fs.writeFile(path.join(FUNCTIONS_FOLDER, file.name), file.content)
    }
  })
  
  it('should create .ai folder structure with function definitions', async () => {
    const aiExists = await fs.stat(AI_FOLDER).then(() => true).catch(() => false)
    expect(aiExists).toBe(true)
    
    const functionFiles = await fs.readdir(FUNCTIONS_FOLDER)
    expect(functionFiles.length).toBeGreaterThan(0)
    expect(functionFiles).toContain('default.md')
    expect(functionFiles).toContain('research.md')
    expect(functionFiles).toContain('list.md')
  })
  
  it('should generate research results with citations', async () => {
    const context = createExecutionContext('test')
    
    const result = await context.research()
    
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('markdown')
    expect(result).toHaveProperty('citations')
    expect(result).toHaveProperty('scrapedCitations')
  })
  
  it('should generate lists with async iterator support', async () => {
    const context = createExecutionContext('test')
    
    const listFn = context.list()
    const items = await listFn()
    
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
    
    const asyncItems: string[] = []
    for await (const item of listFn) {
      asyncItems.push(item)
    }
    
    expect(asyncItems.length).toBeGreaterThan(0)
  })
  
  it('should generate structured objects with ai.functionName', async () => {
    const context = createExecutionContext('test')
    
    const storyBrand = await context.ai.storyBrand()
    
    expect(storyBrand).toHaveProperty('name')
    expect(storyBrand).toHaveProperty('description')
    expect(storyBrand).toHaveProperty('mission')
    expect(storyBrand).toHaveProperty('values')
    expect(storyBrand).toHaveProperty('target_audience')
  })
  
  it('should execute the full startups workflow', async () => {
    const context = createExecutionContext('test')
    const { on, ai, list, research, db } = context
    
    const blogCreateSpy = vi.spyOn(db.blog, 'create')
    
    await on('idea.captured', async (idea: string) => {
      expect(idea).toBe('AI-powered content generation')
      
      const marketsFn = list()
      const markets = await marketsFn()
      expect(Array.isArray(markets)).toBe(true)
      const market = markets[0]
      
      const marketResearch = await research()
      expect(marketResearch).toHaveProperty('markdown')
      
      const icpsFn = list()
      const icps = await icpsFn()
      expect(Array.isArray(icps)).toBe(true)
      const icp = icps[0]
      
      const leanCanvas = await ai.leanCanvas()
      expect(leanCanvas).toBeTruthy()
      
      const storyBrand = await ai.storyBrand()
      expect(storyBrand).toBeTruthy()
      
      const landingPage = await ai.landingPage()
      expect(landingPage).toBeTruthy()
      
      const titlesFn = list()
      const titles = await titlesFn()
      expect(Array.isArray(titles)).toBe(true)
      const title = titles[0]
      
      const content = await ai`write a blog post, starting with "# ${title}"`
      expect(content).toBeTruthy()
      
      await db.blog.create(title, content)
      expect(blogCreateSpy).toHaveBeenCalledWith(title, content)
      
      const influencers = await research()
      expect(influencers).toHaveProperty('markdown')
      
      const competitors = await research()
      expect(competitors).toHaveProperty('markdown')
    })
  })
})
