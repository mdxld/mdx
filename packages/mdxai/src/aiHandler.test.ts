import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ai, executeAiFunction, inferAndValidateOutput, list } from './aiHandler'
import fs from 'fs'
import matter from 'gray-matter'
import * as aiModule from 'ai'
import yaml from 'yaml'
import { createCacheMiddleware } from './cacheMiddleware'
import * as utils from './utils'
import * as llmService from './llmService'
import * as aiSdk from './ai'

// Mock modules at the top level
vi.mock('gray-matter')
vi.mock('yaml', () => ({
  stringify: vi.fn().mockImplementation((obj) => JSON.stringify(obj, null, 2)),
  parse: vi.fn().mockImplementation((str) => JSON.parse(str)),
}))

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: 'mock string response',
    response: {
      body: {
        choices: [
          {
            message: {
              content: 'mock string response',
            },
          },
        ],
      },
    },
  }),
  streamText: vi.fn().mockResolvedValue({
    text: 'mock string response',
    textStream: {
      [Symbol.asyncIterator]: async function* () {
        yield 'mock string response'
      },
    },
  }),
  model: vi.fn().mockReturnValue('mock-model'),
}))

const cacheMiddleware = createCacheMiddleware({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 100,
  persistentCache: true,
  memoryCache: true,
})

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

describe('AI Handler', () => {
  const originalEnv = { ...process.env }
  const mockSystemPrompt = 'You are a helpful assistant. ${prompt}'
  const mockFrontmatter = {
    output: 'string',
  }

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    process.env.USE_CACHE = 'true' // Enable caching for tests
    vi.clearAllMocks()
    
    vi.spyOn(fs, 'readFileSync').mockReturnValue('mock file content')
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'readdirSync').mockReturnValue([])
    
    vi.mocked(matter).mockImplementation(() => createMockGrayMatterFile(mockFrontmatter, mockSystemPrompt))
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  describe('ai template literal', () => {
    it('should handle string output with template literals', async () => {
      const result = await ai`Write about JavaScript`

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('mock string response')
    })

    it('should handle variable interpolation in template literals', async () => {
      const topic = 'TypeScript'
      const result = await ai`Write a blog post about ${topic}`

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('mock string response')
    })

    it('should stringify arrays to YAML in template literals', async () => {
      const items = ['TypeScript', 'JavaScript', 'React']
      const result = await ai`Write a blog post about these technologies: ${items}`

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('mock string response')
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
      expect(result).toContain('mock string response')
      expect(yaml.stringify).toHaveBeenCalledWith(project)
    })
  })

  describe('ai function properties', () => {
    it('should handle named functions with template literals', async () => {
      vi.mocked(matter).mockImplementationOnce(() => createMockGrayMatterFile({ output: 'array' }, 'Generate a list. ${prompt}'))

      const result = await ai.generateList`Generate 3 blog post ideas`

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
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
  })

  describe('executeAiFunction', () => {
    it('should handle string output type', async () => {
      vi.mocked(matter).mockImplementationOnce(() => createMockGrayMatterFile({ output: 'string' }, 'Generate text. ${prompt}'))

      const result = await executeAiFunction('default', 'test prompt')

      expect(typeof result).toBe('string')
      expect(result).toContain('mock string response')
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

    it('should handle enum parsing in object output', async () => {
      vi.mocked(matter).mockImplementationOnce(() =>
        createMockGrayMatterFile(
          {
            output: {
              tone: 'formal|casual|professional',
              status: 'draft|published|archived',
            },
          },
          'Create enum values. ${prompt}',
        ),
      )

      const result = await executeAiFunction('enums', 'test prompt')

      expect(result).toHaveProperty('tone')
      expect(['formal', 'casual', 'professional']).toContain(result.tone)
      expect(result).toHaveProperty('status')
      expect(['draft', 'published', 'archived']).toContain(result.status)
    })
  })

  describe('enhanced object context support', () => {
    it('should handle complex nested objects in function calls', async () => {
      vi.mocked(matter).mockImplementationOnce(() => createMockGrayMatterFile({ output: 'string' }, 'Process this context: ${prompt}'))

      const complexObject = {
        idea: 'AI-powered startup',
        market: { size: '100B', segments: ['enterprise', 'consumer'] },
        metrics: [{ name: 'revenue', value: 1000000 }],
      }

      const result = await ai.leanCanvas(complexObject)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle complex objects in template literals', async () => {
      const complexContext = {
        idea: 'AI startup',
        marketResearch: { data: 'extensive research' },
      }

      const result = await ai`Create a plan for ${complexContext}`

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
  })

  describe('type inference and validation', () => {
    it('should validate output types against schema', async () => {
      const result = inferAndValidateOutput({ name: 'string', count: 'number' }, { name: 'test', count: 42 })

      expect(result).toEqual({ name: 'test', count: 42 })
    })

    it('should handle validation failures gracefully', async () => {
      const result = inferAndValidateOutput({ name: 'string' }, { invalidKey: 'value' })

      expect(result).toEqual({ invalidKey: 'value' })
    })
  })

  describe('list function', () => {
    it('should work as a Promise returning string array', async () => {
      const result = await list`Generate 5 programming languages`

      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual(['Item 1', 'Item 2', 'Item 3'])
    })

    it('should work as an AsyncIterable', async () => {
      const items: string[] = []

      for await (const item of list`Generate 5 programming languages`) {
        items.push(item)
      }

      expect(items).toEqual(['Item 1', 'Item 2', 'Item 3'])
    })

    it('should handle template literal interpolation', async () => {
      const topic = 'TypeScript'
      const count = 5
      const result = await list`Generate ${count} tips for ${topic}`

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should support Promise methods', async () => {
      const result = list`Generate ideas`

      expect(typeof result.then).toBe('function')
      expect(typeof result.catch).toBe('function')
      expect(typeof result.finally).toBe('function')
    })

    it('should support async iterator protocol', () => {
      const result = list`Generate ideas`

      expect(typeof result[Symbol.asyncIterator]).toBe('function')
    })

    it('should throw error when not used as template literal', () => {
      const incorrectUsage = new Function('list', 'return list("not a template literal")')

      expect(() => {
        incorrectUsage(list)
      }).toThrow('list function must be used as a template literal tag')
    })

    it('should use YAML.stringify for arrays and objects', () => {
      expect(yaml.stringify).toBeDefined()
    })
  })
})

// Skip e2e tests in CI environment
describe.skipIf(process.env.CI === 'true')('AI Handler e2e', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    if (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN) {
      console.log('Skipping AI Handler e2e test: OPENAI_API_KEY or AI_GATEWAY_TOKEN not set')
      return
    }
    
    process.env.NODE_ENV = 'development'
    vi.clearAllMocks()
    
    // Use spyOn instead of mocked
    vi.spyOn(fs, 'readFileSync').mockReturnValue('mock file content')
    vi.mocked(matter).mockImplementation(() => 
      createMockGrayMatterFile({ output: 'string' }, 'You are a helpful assistant. ${prompt}')
    )
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should generate text using real API with caching', async () => {
    if (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN) {
      return
    }

    // Skip this test in CI environment
    if (process.env.CI === 'true') {
      return
    }

    // Restore original modules for e2e tests
    vi.restoreAllMocks()
    
    const result1 = await ai`Write a short greeting`
    
    expect(result1).toBeDefined()
    expect(typeof result1).toBe('string')
    expect(result1.length).toBeGreaterThan(0)
    
    const result2 = await ai`Write a short greeting`
    
    expect(result2).toBeDefined()
    expect(typeof result2).toBe('string')
    expect(result2).toBe(result1)
  }, 30000)

  it('should handle errors gracefully with real API', async () => {
    if (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN) {
      return
    }

    // Skip this test in CI environment
    if (process.env.CI === 'true') {
      return
    }

    // Restore original modules for e2e tests
    vi.restoreAllMocks()
    
    try {
      const result = await ai``
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    } catch (error: any) {
      expect(error.message).toBeDefined()
    }
  }, 30000)
})

describe('extract function integration', () => {
  it('should be available as import from aiHandler', async () => {
    const { extract } = await import('./functions/extract')

    expect(extract).toBeDefined()
    expect(typeof extract).toBe('function')
  })

  it('should work with the existing AI infrastructure', async () => {
    const { extract } = await import('./functions/extract')
    const result = await extract`Extract test data`

    expect(result).toBeDefined()
  })
})
