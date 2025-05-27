import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ai, research, generateAiText, executeAiFunction, inferAndValidateOutput, list } from '../src/aiHandler.js'
import yaml from 'yaml'
import fs from 'fs'
import matter from 'gray-matter'

type MockGrayMatterFile = {
  data: Record<string, any>
  content: string
  excerpt?: string
  orig: string
  language: string
  matter: string
  stringify: () => string
  isEmpty?: boolean
}

function createMockGrayMatterFile(data: Record<string, any>, content: string): MockGrayMatterFile {
  return {
    data,
    content,
    orig: content,
    language: 'md',
    matter: '',
    stringify: () => content,
    isEmpty: false,
  }
}

vi.mock('fs', async () => {
  return {
    default: {
      readFileSync: vi.fn(),
      existsSync: vi.fn().mockReturnValue(true),
      readdirSync: vi.fn().mockReturnValue([]),
    },
    readFileSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(true),
    readdirSync: vi.fn().mockReturnValue([]),
  }
})

vi.mock('gray-matter', () => ({
  default: vi.fn(),
}))

vi.mock('ai', () => ({
  streamText: vi.fn().mockResolvedValue({
    text: 'This is a mock string response for testing purposes. It simulates what would be returned from the AI model in a real environment.',
    textStream: {
      [Symbol.asyncIterator]: async function* () {
        yield 'This is a mock string response for testing purposes. It simulates what would be returned from the AI model in a real environment.'
      },
    },
  }),
  streamObject: vi.fn().mockResolvedValue({
    object: {
      name: 'Mock Brand name',
      description: 'Mock Brand description',
      tone: 'formal',
      status: 'draft',
      storyElements: {
        hero: 'Customer as hero',
        problem: 'Inefficient processes',
        guide: 'Our product as guide',
        plan: 'Implementation strategy',
        callToAction: 'Sign up now'
      }
    },
    partialObjectStream: {
      [Symbol.asyncIterator]: async function* () {
        yield { name: 'Mock Brand name' }
        yield { description: 'Mock Brand description' }
        yield { 
          storyElements: {
            hero: 'Customer as hero',
            problem: 'Inefficient processes'
          }
        }
        yield { 
          storyElements: {
            guide: 'Our product as guide',
            plan: 'Implementation strategy',
            callToAction: 'Sign up now'
          }
        }
      },
    },
  }),
  model: vi.fn().mockReturnValue('mock-model'),
}))

vi.mock('../src/utils.js', () => ({
  findAiFunction: vi.fn().mockResolvedValue({
    filePath: '/path/to/mock/file.md',
    content: '',
  }),
  findAiFunctionEnhanced: vi.fn().mockResolvedValue({
    filePath: '/path/to/mock/file.md',
    content: '',
  }),
  ensureAiFunctionExists: vi.fn().mockReturnValue('/path/to/mock/file.md'),
  createAiFolderStructure: vi.fn(),
  writeAiFunction: vi.fn(),
  findAiFunctionsInHierarchy: vi.fn().mockReturnValue([]),
  createAiFunctionVersion: vi.fn(),
  listAiFunctionVersions: vi.fn(),
  AI_FOLDER_STRUCTURE: {
    ROOT: '.ai',
    FUNCTIONS: 'functions',
    TEMPLATES: 'templates',
    VERSIONS: 'versions',
    CACHE: 'cache',
  },
}))

vi.mock('../src/llmService.js', () => ({
  generateListStream: vi.fn().mockResolvedValue({
    textStream: {
      [Symbol.asyncIterator]: async function* () {
        yield 'This is a mock list response'
      },
    },
  }),
}))

vi.mock('yaml', () => {
  return {
    default: {
      stringify: vi.fn().mockImplementation((value) => {
        if (Array.isArray(value)) {
          return `- ${value.join('\n- ')}\n`
        }
        if (typeof value === 'object' && value !== null) {
          return (
            Object.entries(value)
              .map(([k, v]) => `${k}: ${v}`)
              .join('\n') + '\n'
          )
        }
        return String(value)
      }),
    },
  }
})

describe('mdxai aiHandler', () => {
  const originalEnv = { ...process.env }
  const mockSystemPrompt = 'You are a helpful assistant. ${prompt}'
  const mockFrontmatter = {
    output: 'string',
  }

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    vi.clearAllMocks()

    vi.mocked(matter).mockImplementation(() => createMockGrayMatterFile(mockFrontmatter, mockSystemPrompt))
    vi.mocked(fs.readFileSync).mockReturnValue('mock file content')
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('core functionality', () => {
    it('should be importable', () => {
      expect(ai).toBeDefined()
      expect(research).toBeDefined()
      expect(generateAiText).toBeDefined()
      expect(executeAiFunction).toBeDefined()
      expect(inferAndValidateOutput).toBeDefined()
    })
  })

  describe('template literal interface', () => {
    it('should handle string output with template literals', async () => {
      const result = await ai`Write about JavaScript`

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('This is a mock string response')
    })

    it('should handle variable interpolation in template literals', async () => {
      const topic = 'TypeScript'
      const result = await ai`Write a blog post about ${topic}`

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('This is a mock string response')
    })

    it('should stringify arrays to YAML in template literals', async () => {
      const items = ['TypeScript', 'JavaScript', 'React']
      const result = await ai`Write a blog post about these technologies: ${items}`

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('This is a mock string response')
      expect(yaml.stringify).toHaveBeenCalledWith(items)
    })

    it('should stringify objects to YAML in template literals', async () => {
      const project = {
        name: 'MDX AI',
        technologies: ['TypeScript', 'React'],
        features: {
          templateLiterals: true,
          yamlSupport: true,
        },
      }
      const result = await ai`Write a blog post about this project: ${project}`

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('This is a mock string response')
      expect(yaml.stringify).toHaveBeenCalledWith(project)
    })
  })

  describe('dynamic API patterns', () => {
    describe('template literal pattern', () => {
      it('should handle basic string interpolation', async () => {
        const topic = 'AI development'
        const result = await ai`Write a blog post about ${topic}`
        
        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(result).toContain('This is a mock string response')
      })
      
      it('should handle multiple interpolated values', async () => {
        const topic = 'React'
        const audience = 'beginners'
        const length = 'short'
        
        const result = await ai`Write a ${length} blog post about ${topic} for ${audience}`
        
        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(result).toContain('This is a mock string response')
      })
      
      it('should handle complex object interpolation', async () => {
        const params = {
          topic: 'AI',
          audience: 'developers',
          format: 'tutorial',
          sections: ['Introduction', 'Setup', 'Implementation', 'Conclusion']
        }
        
        const result = await ai`Generate content with these parameters: ${params}`
        
        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(yaml.stringify).toHaveBeenCalledWith(params)
      })
      
      it('should handle named functions with template literals', async () => {
        vi.mocked(matter).mockImplementationOnce(() => createMockGrayMatterFile({ output: 'array' }, 'Generate a list. ${prompt}'))
  
        const result = await ai.generateList`Generate 3 blog post ideas`
  
        expect(Array.isArray(result)).toBe(true)
      })
    })

    describe('function call pattern', () => {
      it('should handle simple string parameters', async () => {
        vi.mocked(matter).mockImplementationOnce(() => createMockGrayMatterFile({ output: 'string' }, 'Process this prompt: ${prompt}'))
        
        const result = await ai.summarize('Summarize this long article about artificial intelligence')
        
        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(result).toContain('This is a mock string response')
      })
      
      it('should handle object parameters', async () => {
        vi.mocked(matter).mockImplementationOnce(() =>
          createMockGrayMatterFile(
            {
              output: {
                name: 'Brand name',
                description: 'Brand description',
                tone: 'formal|casual|professional',
                status: 'draft|published|archived',
              },
            },
            'Create a brand story. ${prompt}',
          ),
        )
  
        const result = await ai.storyBrand({ brand: 'Vercel' })
  
        expect(result).toBeDefined()
        expect(typeof result).toBe('object')
        expect(result).toHaveProperty('name')
        expect(result).toHaveProperty('description')
        expect(result).toHaveProperty('tone')
        expect(result).toHaveProperty('status')
      })
      
      it('should handle array parameters', async () => {
        vi.mocked(matter).mockImplementationOnce(() => createMockGrayMatterFile({ output: 'string' }, 'Process these items: ${prompt}'))
        
        const items = ['React', 'Vue', 'Angular', 'Svelte']
        const result = await ai.compareFrameworks(items)
        
        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(yaml.stringify).toHaveBeenCalledWith(items)
      })
      
      it('should handle nested object parameters', async () => {
        vi.mocked(matter).mockImplementationOnce(() => createMockGrayMatterFile({ output: 'string' }, 'Analyze this data: ${prompt}'))
        
        const data = {
          project: 'MDX AI',
          metrics: {
            users: 5000,
            engagement: '85%',
            retention: '72%'
          },
          features: ['Template literals', 'Function calls', 'YAML support'],
          goals: {
            shortTerm: 'Improve documentation',
            longTerm: 'Expand API capabilities'
          }
        }
        
        const result = await ai.analyzeData(data)
        
        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(yaml.stringify).toHaveBeenCalledWith(data)
      })
    })
  })

  describe('startup syntax', () => {
    it('should handle leanCanvas with complex nested objects', async () => {
      vi.mocked(matter).mockImplementationOnce(() => createMockGrayMatterFile({ output: 'string' }, 'Process this lean canvas: ${prompt}'))

      const complexObject = {
        idea: 'AI-powered startup',
        market: { size: '100B', segments: ['enterprise', 'consumer'] },
        metrics: [{ name: 'revenue', value: 1000000 }],
        problemStatement: 'Inefficient content creation',
        solution: 'AI-assisted content generation',
        uniqueValueProposition: 'Save 80% of content creation time',
        channels: ['Direct sales', 'Content marketing', 'Partnerships'],
        customerSegments: ['Marketing agencies', 'Content creators', 'Enterprise'],
        costStructure: ['Engineering', 'Marketing', 'Operations'],
        revenueStreams: ['Subscription', 'Enterprise licensing', 'API usage']
      }

      const result = await ai.leanCanvas(complexObject)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(yaml.stringify).toHaveBeenCalledWith(complexObject)
    })

    it('should handle storyBrand with complex brand objects', async () => {
      
      vi.mocked(matter).mockImplementationOnce(() => 
        createMockGrayMatterFile(
          {
            output: {
              name: 'string',
              description: 'string',
              tone: 'formal|casual|professional',
              status: 'draft|published|archived',
              storyElements: {
                hero: 'string',
                problem: 'string',
                guide: 'string',
                plan: 'string',
                callToAction: 'string'
              }
            },
          },
          'Create a brand story using StoryBrand framework: ${prompt}'
        )
      )

      const brandObject = {
        brand: 'TechAI',
        industry: 'Technology',
        target: 'Enterprise businesses',
        competitors: ['CompetitorA', 'CompetitorB'],
        values: {
          innovation: 'Leading edge technology',
          reliability: '99.9% uptime guarantee',
          simplicity: 'Easy to use interface'
        },
        mission: 'Empower businesses with AI',
        vision: 'Transform how businesses operate with AI'
      }

      const result = await ai.storyBrand(brandObject)

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('description')
      expect(result).toHaveProperty('tone')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('storyElements')
      expect(result.storyElements).toHaveProperty('mockNestedKey')
      expect(yaml.stringify).toHaveBeenCalledWith(brandObject)
    })

    it('should handle complex objects in template literals', async () => {
      const complexContext = {
        idea: 'AI startup',
        marketResearch: { data: 'extensive research' },
        competitors: ['CompA', 'CompB', 'CompC'],
        targetMarket: {
          segments: ['Enterprise', 'SMB', 'Creators'],
          geography: ['North America', 'Europe', 'Asia'],
          size: '$50B annually'
        }
      }

      const result = await ai`Create a business plan for ${complexContext}`

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(yaml.stringify).toHaveBeenCalledWith(complexContext)
    })
  })

  describe('output type handling', () => {
    it('should handle string output type', async () => {
      vi.mocked(matter).mockImplementationOnce(() => createMockGrayMatterFile({ output: 'string' }, 'Generate text. ${prompt}'))

      const result = await executeAiFunction('default', 'test prompt')

      expect(typeof result).toBe('string')
      expect(result).toContain('This is a mock string response')
    })

    it('should handle array output type', async () => {
      vi.mocked(matter).mockImplementationOnce(() => createMockGrayMatterFile({ output: 'array' }, 'Generate a list. ${prompt}'))

      const result = await executeAiFunction('list', 'test prompt')

      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle object output type', async () => {
      vi.mocked(matter).mockImplementationOnce(() =>
        createMockGrayMatterFile(
          {
            output: {
              name: 'Brand name',
              description: 'Brand description',
              tone: 'formal|casual|professional',
              status: 'draft|published|archived',
            },
          },
          'Create a brand story. ${prompt}',
        ),
      )

      const result = await executeAiFunction('storyBrand', 'test prompt')

      expect(typeof result).toBe('object')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('tone')
    })

    it('should validate output types against schema', async () => {
      const result = inferAndValidateOutput({ name: 'string', count: 'number' }, { name: 'test', count: 42 })

      expect(result).toEqual({ name: 'test', count: 42 })
    })
  })

  describe('extract function integration', () => {
    it('should be available as import from aiHandler', async () => {
      const { extract } = await import('../src/functions/extract.js')

      expect(extract).toBeDefined()
      expect(typeof extract).toBe('function')
    })

    it('should work with the existing AI infrastructure', async () => {
      const { extract } = await import('../src/functions/extract.js')
      const result = await extract`Extract test data`

      expect(result).toBeDefined()
    })
  })
})
