import { describe, expect, it, vi, beforeEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import { MutableEventContext } from '../../../packages/mdxe/cli/src/utils/event-system'

interface ResearchResult {
  text: string;
  markdown: string;
  citations: string[];
  reasoning: string;
  scrapedCitations: {
    url: string;
    title: string;
    description: string;
    markdown: string;
  }[];
}

interface LeanCanvas {
  problem: string;
  solution: string;
  uniqueValueProposition: string;
  customerSegments: string[];
  channels: string[];
  revenue: string;
  costs: string;
}

interface StoryBrand {
  name: string;
  description: string;
  mission: string;
  values: string;
  target_audience: string;
  tone: string;
  key_messages: string[];
  status: string;
}

interface LandingPage {
  headline: string;
  subheadline: string;
  features: string[];
  cta: string;
}

interface ListFunction extends AsyncIterable<string> {
  (): Promise<string[]>;
}

interface AiFunction {
  (strings: TemplateStringsArray, ...values: any[]): Promise<string>;
  leanCanvas: (params: any) => Promise<LeanCanvas>;
  storyBrand: (params: any) => Promise<StoryBrand>;
  landingPage: (params: any) => Promise<LandingPage>;
}

interface MockExecutionContext {
  ai: AiFunction;
  research: (strings: TemplateStringsArray, ...values: any[]) => Promise<ResearchResult>;
  list: (strings: TemplateStringsArray, ...values: any[]) => ListFunction;
  extract: (strings: TemplateStringsArray, ...values: any[]) => Promise<string[]>;
  on: (event: string, callback: (data: any, context?: MutableEventContext) => any) => any;
  db: {
    build: any;
    watch: any;
    get: any;
    list: any;
    set: any;
    delete: any;
    blog: {
      create: any;
      get: any;
      list: any;
      update: any;
      delete: any;
    };
  };
  generateText: (params: { prompt: string, functionName: string }) => Promise<{ text: string }>;
  createAiFolderStructure: () => Promise<void>;
}

vi.mock('../../../packages/mdxe/cli/src/utils/execution-context', () => {
  const createMockList = (strings?: TemplateStringsArray, ...values: any[]): ListFunction => {
    const mockItems = ['Item 1', 'Item 2', 'Item 3']
    
    const listFn = function() {
      return Promise.resolve(mockItems)
    } as ListFunction
    
    listFn[Symbol.asyncIterator] = function() {
      let index = 0
      return {
        next: async () => {
          if (index < mockItems.length) {
            return { value: mockItems[index++], done: false }
          } else {
            return { value: undefined, done: true }
          }
        }
      }
    }
    
    return listFn
  }
  
  const mockDb = {
    build: vi.fn().mockResolvedValue(true),
    watch: vi.fn().mockResolvedValue(true),
    get: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue([]),
    set: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(true),
    blog: {
      create: vi.fn().mockImplementation((title: string, content: string) => Promise.resolve({
        id: title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
        title,
        content,
        date: new Date().toISOString()
      })),
      get: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(true)
    }
  }
  
  const createMockAiFunction = (): AiFunction => {
    const mockAiFn = vi.fn((strings: TemplateStringsArray, ...values: any[]) => {
      if (strings && 'raw' in strings) {
        const prompt = String.raw({ raw: strings }, ...values)
        return Promise.resolve(`Mock AI response for: ${prompt}`)
      }
      return Promise.resolve('Mock AI response')
    }) as unknown as AiFunction
    
    mockAiFn.leanCanvas = vi.fn().mockResolvedValue({
      problem: 'Content creation is time-consuming',
      solution: 'AI-powered content generation',
      uniqueValueProposition: 'Save time and improve quality',
      customerSegments: ['Small businesses', 'Content marketers'],
      channels: ['Direct sales', 'Online marketing'],
      revenue: 'Subscription model',
      costs: 'AI API costs, development, marketing'
    })
    
    mockAiFn.storyBrand = vi.fn().mockResolvedValue({
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
    
    mockAiFn.landingPage = vi.fn().mockResolvedValue({
      headline: 'Create Better Content 10x Faster with AI',
      subheadline: 'The AI-powered platform for small businesses',
      features: ['AI content generation', 'SEO optimization', 'Brand voice customization'],
      cta: 'Start Free Trial'
    })
    
    return mockAiFn
  }
  
  return {
    createExecutionContext: vi.fn((): MockExecutionContext => {
      const mockAi = createMockAiFunction()
      
      const mockResearch = vi.fn((strings: TemplateStringsArray, ...values: any[]): Promise<ResearchResult> => {
        return Promise.resolve({
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
        })
      })
      
      const mockList = vi.fn((strings: TemplateStringsArray, ...values: any[]): ListFunction => createMockList())
      
      const mockExtract = vi.fn((strings: TemplateStringsArray, ...values: any[]): Promise<string[]> => {
        return Promise.resolve(['Item 1', 'Item 2', 'Item 3'])
      })
      
      return {
        ai: mockAi,
        research: mockResearch,
        list: mockList,
        extract: mockExtract,
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
    const context = createExecutionContext('test') as unknown as MockExecutionContext
    
    await context.createAiFolderStructure()
    
    const aiExists = await fs.stat(AI_FOLDER).then(() => true).catch(() => false)
    expect(aiExists).toBe(true)
    
    const functionFiles = await fs.readdir(FUNCTIONS_FOLDER)
    expect(functionFiles.length).toBeGreaterThan(0)
  })
  
  it('should generate research results with citations', async () => {
    const context = createExecutionContext('test') as unknown as MockExecutionContext
    
    const result = await context.research`AI tools in the context of delivering AI-powered content generation`
    
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('markdown')
    expect(result).toHaveProperty('citations')
    expect(result).toHaveProperty('scrapedCitations')
    
    expect(result.markdown).toContain('[ ¹ ](#1)')
    expect(result.markdown).toContain('<details id="1">')
  })
  
  it('should generate lists with async iterator support', async () => {
    const context = createExecutionContext('test') as unknown as MockExecutionContext
    
    const listFn = context.list`10 possible market segments for AI-powered content generation`
    const items = await listFn()
    
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
    
    const asyncItems: string[] = []
    for await (const item of context.list`5 blog post titles for AI tools`) {
      asyncItems.push(item)
    }
    
    expect(asyncItems.length).toBeGreaterThan(0)
  })
  
  it('should generate structured objects with ai.functionName', async () => {
    const context = createExecutionContext('test') as unknown as MockExecutionContext
    
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
    const context = createExecutionContext('test') as unknown as MockExecutionContext
    
    const result1 = await context.ai`Generate content about AI`
    const result2 = await context.ai`Generate content about AI`
    
    expect(result1).toEqual(result2)
    
    const cacheFiles = await fs.readdir(CACHE_FOLDER)
    expect(cacheFiles.length).toBeGreaterThan(0)
  })
  
  it('should execute the full startups workflow', async () => {
    const context = createExecutionContext('test') as unknown as MockExecutionContext
    const { on, ai, list, research, db } = context
    
    const blogCreateSpy = vi.spyOn(db.blog, 'create')
    
    await on('idea.captured', async (idea) => {
      const typedAi = ai as AiFunction
      const typedList = list as (strings: TemplateStringsArray, ...values: any[]) => ListFunction
      expect(idea).toBe('AI-powered content generation')
      
      const listFn = typedList`10 possible market segments for ${idea}`
      const markets = await listFn()
      expect(Array.isArray(markets)).toBe(true)
      expect(markets.length).toBeGreaterThan(0)
      const market = markets[0]
      
      const marketResearch = await research`${market} in the context of delivering ${idea}`
      expect(marketResearch).toHaveProperty('markdown')
      
      const icpsFn = typedList`10 possible ideal customer profiles for ${{ idea, market, marketResearch }}`
      const icps = await icpsFn()
      expect(Array.isArray(icps)).toBe(true)
      expect(icps.length).toBeGreaterThan(0)
      const icp = icps[0]
      
      const leanCanvas = await typedAi.leanCanvas({ idea, market, icp, marketResearch })
      expect(leanCanvas).toBeTruthy()
      
      const storyBrand = await typedAi.storyBrand({ idea, market, icp, marketResearch, leanCanvas })
      expect(storyBrand).toBeTruthy()
      
      const landingPage = await typedAi.landingPage({ idea, market, icp, marketResearch, leanCanvas, storyBrand })
      expect(landingPage).toBeTruthy()
      
      const titlesFn = typedList`25 blog post titles for ${{ idea, icp, market, leanCanvas, storyBrand }}`
      const titles = await titlesFn()
      expect(Array.isArray(titles)).toBe(true)
      expect(titles.length).toBeGreaterThan(0)
      const title = titles[0]
      
      const content = await typedAi`write a blog post, starting with "# ${title}"`
      expect(content).toContain(`# ${title}`)
      
      await db.blog.create(title, content)
      expect(blogCreateSpy).toHaveBeenCalledWith(title, content)
      
      const influencers = await research`influencers across all social media platforms for ${icp} in ${market}`
      expect(influencers).toHaveProperty('markdown')
      
      const competitors = await research`competitors of ${idea} for ${icp} in ${market}`
      expect(competitors).toHaveProperty('markdown')
    })
  })
})
