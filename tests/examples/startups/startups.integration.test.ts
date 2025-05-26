import { describe, expect, it, vi, beforeEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import { MutableEventContext } from '../../../packages/mdxe/cli/src/utils/event-system'

type ResearchResult = {
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
};

type LeanCanvas = {
  problem: string;
  solution: string;
  uniqueValueProposition: string;
  customerSegments: string[];
  channels: string[];
  revenue: string;
  costs: string;
};

type StoryBrand = {
  name: string;
  description: string;
  mission: string;
  values: string;
  target_audience: string;
  tone: string;
  key_messages: string[];
  status: string;
};

type LandingPage = {
  headline: string;
  subheadline: string;
  features: string[];
  cta: string;
};

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
    blog: {
      create: (title: string, content: string) => Promise<any>;
      get: any;
      list: any;
      update: any;
      delete: any;
    };
    get: any;
    list: any;
    set: any;
    delete: any;
  };
  generateText: (params: { prompt: string, functionName: string }) => Promise<{ text: string }>;
  createAiFolderStructure: () => Promise<void>;
}

vi.mock('../../../packages/mdxe/cli/src/utils/execution-context', () => {
  return {
    createExecutionContext: vi.fn((): MockExecutionContext => {
      const createMockListFn = (items = ['Item 1', 'Item 2', 'Item 3']): ListFunction => {
        const mockListFn = function() {
          return Promise.resolve(items)
        } as ListFunction
        
        mockListFn[Symbol.asyncIterator] = function() {
          let index = 0
          return {
            next: async () => {
              if (index < items.length) {
                return { value: items[index++], done: false }
              } else {
                return { value: undefined, done: true }
              }
            }
          }
        }
        
        return mockListFn
      }
      
      const mockAiFn = vi.fn((strings: TemplateStringsArray, ...values: any[]) => {
        const prompt = String.raw({ raw: strings }, ...values)
        return Promise.resolve(`Mock AI response for: ${prompt}`)
      }) as unknown as AiFunction
      
      mockAiFn.leanCanvas = vi.fn().mockResolvedValue({
        problem: 'Content creation is time-consuming',
        solution: 'AI-powered content generation',
        uniqueValueProposition: 'Save time and improve quality',
        customerSegments: ['Small businesses', 'Content marketers'],
        channels: ['Direct sales', 'Online marketing'],
        revenue: 'Subscription model',
        costs: 'AI API costs, development, marketing'
      } as LeanCanvas)
      
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
      } as StoryBrand)
      
      mockAiFn.landingPage = vi.fn().mockResolvedValue({
        headline: 'Create Better Content 10x Faster with AI',
        subheadline: 'The AI-powered platform for small businesses',
        features: ['AI content generation', 'SEO optimization', 'Brand voice customization'],
        cta: 'Start Free Trial'
      } as LandingPage)
      
      const mockResearchFn = vi.fn((strings: TemplateStringsArray, ...values: any[]): Promise<ResearchResult> => {
        const prompt = String.raw({ raw: strings }, ...values)
        return Promise.resolve({
          text: `Mock research results for: ${prompt}`,
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
        } as ResearchResult)
      })
      
      const mockListFn = vi.fn((strings: TemplateStringsArray, ...values: any[]): ListFunction => {
        const prompt = String.raw({ raw: strings }, ...values)
        return createMockListFn([
          `Item 1 for ${prompt}`,
          `Item 2 for ${prompt}`,
          `Item 3 for ${prompt}`
        ])
      })
      
      const mockExtractFn = vi.fn((strings: TemplateStringsArray, ...values: any[]): Promise<string[]> => {
        const prompt = String.raw({ raw: strings }, ...values)
        return Promise.resolve([
          `Extracted item 1 for ${prompt}`,
          `Extracted item 2 for ${prompt}`,
          `Extracted item 3 for ${prompt}`
        ])
      })
      
      const mockDb = {
        blog: {
          create: vi.fn((title: string, content: string) => {
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
      const mockOnFn = vi.fn((event: string, callback: Function) => {
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
        ai: mockAiFn,
        research: mockResearchFn,
        list: mockListFn,
        extract: mockExtractFn,
        on: mockOnFn,
        db: mockDb,
        generateText: vi.fn(({ prompt, functionName }: { prompt: string, functionName: string }) => {
          return Promise.resolve({ text: `Mock response for ${functionName}: ${prompt}` })
        }),
        createAiFolderStructure: vi.fn().mockResolvedValue(undefined)
      }
    })
  }
})

import { createExecutionContext } from '../../../packages/mdxe/cli/src/utils/execution-context';

describe('Startups Example Integration', () => {
  const AI_FOLDER = path.join(process.cwd(), '.ai');
  const CACHE_FOLDER = path.join(AI_FOLDER, 'cache');
  const FUNCTIONS_FOLDER = path.join(AI_FOLDER, 'functions');
  
  beforeEach(async () => {
    vi.clearAllMocks();
    
    await fs.mkdir(AI_FOLDER, { recursive: true });
    await fs.mkdir(CACHE_FOLDER, { recursive: true });
    await fs.mkdir(FUNCTIONS_FOLDER, { recursive: true });
    
    const functionFiles = [
      { name: 'default.md', content: '# Default AI Function\n\nThis is the default AI function.' },
      { name: 'research.md', content: '# Research Function\n\nThis function performs research with citations.' },
      { name: 'list.md', content: '# List Function\n\nThis function generates lists of items.' },
      { name: 'leanCanvas.md', content: '# Lean Canvas Function\n\nThis function generates a lean canvas.' },
      { name: 'storyBrand.md', content: '# Story Brand Function\n\nThis function generates a story brand.' },
      { name: 'landingPage.md', content: '# Landing Page Function\n\nThis function generates a landing page.' }
    ];
    
    for (const file of functionFiles) {
      await fs.writeFile(path.join(FUNCTIONS_FOLDER, file.name), file.content);
    }
  });
  
  it('should create .ai folder structure with function definitions', async () => {
    const context = createExecutionContext('test') as unknown as MockExecutionContext;
    await context.createAiFolderStructure();
    
    const aiExists = await fs.stat(AI_FOLDER).then(() => true).catch(() => false);
    expect(aiExists).toBe(true);
    
    const functionFiles = await fs.readdir(FUNCTIONS_FOLDER);
    expect(functionFiles.length).toBeGreaterThan(0);
    expect(functionFiles).toContain('default.md');
    expect(functionFiles).toContain('research.md');
    expect(functionFiles).toContain('list.md');
  });
  
  it('should generate research results with citations', async () => {
    const context = createExecutionContext('test') as unknown as MockExecutionContext;
    
    const result = await context.research`AI tools in the context of delivering AI-powered content generation`;
    
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('markdown');
    expect(result).toHaveProperty('citations');
    expect(result).toHaveProperty('scrapedCitations');
  });
  
  it('should generate lists with async iterator support', async () => {
    const context = createExecutionContext('test') as unknown as MockExecutionContext;
    
    const listFn = context.list`10 possible market segments for AI-powered content generation`;
    const items = await listFn();
    
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    
    const asyncItems: string[] = [];
    for await (const item of context.list`5 blog post titles for AI tools`) {
      asyncItems.push(item);
    }
    
    expect(asyncItems.length).toBeGreaterThan(0);
  });
  
  it('should generate structured objects with ai.functionName', async () => {
    const context = createExecutionContext('test') as unknown as MockExecutionContext;
    
    const storyBrand = await context.ai.storyBrand({
      idea: 'AI-powered content generation',
      market: 'Digital Marketing',
      icp: 'Small business owners',
      marketResearch: 'Market is growing at 15% annually'
    });
    
    expect(storyBrand).toHaveProperty('name');
    expect(storyBrand).toHaveProperty('description');
    expect(storyBrand).toHaveProperty('mission');
    expect(storyBrand).toHaveProperty('values');
    expect(storyBrand).toHaveProperty('target_audience');
  });
  
  it('should execute the full startups workflow', async () => {
    const context = createExecutionContext('test') as unknown as MockExecutionContext;
    const { on, ai, list, research, db } = context;
    
    const blogCreateSpy = vi.spyOn(db.blog, 'create');
    
    await on('idea.captured', async (idea: string) => {
      const typedAi = ai as AiFunction;
      const typedList = list as (strings: TemplateStringsArray, ...values: any[]) => ListFunction;
      expect(idea).toBe('AI-powered content generation');
      
      const marketsFn = typedList`10 possible market segments for ${idea}`;
      const markets = await marketsFn();
      expect(Array.isArray(markets)).toBe(true);
      const market = markets[0];
      
      const marketResearch = await research`${market} in the context of delivering ${idea}`;
      expect(marketResearch).toHaveProperty('markdown');
      
      const icpsFn = typedList`10 possible ideal customer profiles for ${{ idea, market, marketResearch }}`;
      const icps = await icpsFn();
      expect(Array.isArray(icps)).toBe(true);
      const icp = icps[0];
      
      const leanCanvas = await typedAi.leanCanvas({ idea, market, icp, marketResearch });
      expect(leanCanvas).toBeTruthy();
      
      const storyBrand = await typedAi.storyBrand({ idea, market, icp, marketResearch, leanCanvas });
      expect(storyBrand).toBeTruthy();
      
      const landingPage = await typedAi.landingPage({ idea, market, icp, marketResearch, leanCanvas, storyBrand });
      expect(landingPage).toBeTruthy();
      
      const titlesFn = typedList`25 blog post titles for ${{ idea, icp, market, leanCanvas, storyBrand }}`;
      const titles = await titlesFn();
      expect(Array.isArray(titles)).toBe(true);
      const title = titles[0];
      
      const content = await typedAi`write a blog post, starting with "# ${title}"`;
      expect(content).toBeTruthy();
      
      await db.blog.create(title, content);
      expect(blogCreateSpy).toHaveBeenCalledWith(title, content);
      
      const influencers = await research`influencers across all social media platforms for ${icp} in ${market}`;
      expect(influencers).toHaveProperty('markdown');
      
      const competitors = await research`competitors of ${idea} for ${icp} in ${market}`;
      expect(competitors).toHaveProperty('markdown');
    });
  });
});
