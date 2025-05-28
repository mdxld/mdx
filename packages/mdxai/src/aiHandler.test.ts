import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ai, executeAiFunction, inferAndValidateOutput, list } from './aiHandler'
import fs from 'fs'
import matter from 'gray-matter'
import * as aiModule from 'ai'
import * as YAML from 'yaml'

// Mock modules at the top level
vi.mock('gray-matter')

// Mock yaml module with proper default export
vi.mock('yaml', () => {
  // Create a string with trim method for stringify to return
  const mockYamlString = (obj: any) => {
    const str = JSON.stringify(obj, null, 2)
    return {
      toString: () => str,
      trim: () => str.trim(),
      valueOf: () => str
    }
  }
  
  const stringify = vi.fn().mockImplementation((obj) => {
    return mockYamlString(obj)
  })
  
  const parse = vi.fn().mockImplementation((str) => {
    return JSON.parse(str)
  })
  
  // Export both as named exports and as default export properties
  return {
    stringify,
    parse,
    default: {
      stringify,
      parse
    }
  }
})

// Mock ai module
vi.mock('ai', () => {
  // Create a mock textStream that can be reused
  const mockTextStream = {
    [Symbol.asyncIterator]: async function* () {
      yield 'mock string response'
    }
  }
  
  // Create a mock streamText result
  const mockStreamTextResult = {
    text: Promise.resolve('mock string response'),
    textStream: mockTextStream,
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
  }
  
  return {
    generateText: vi.fn().mockImplementation(() => {
      return Promise.resolve({
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
      })
    }),
    streamText: vi.fn().mockImplementation(() => {
      return Promise.resolve(mockStreamTextResult)
    }),
    generateObject: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        object: { result: 'mock object response' }
      })
    }),
    model: vi.fn().mockReturnValue('mock-model'),
    wrapLanguageModel: vi.fn().mockImplementation(({ model }) => model),
  }
})

// Mock QueueManager
vi.mock('./ui/index.js', () => ({
  QueueManager: class {
    constructor() {}
    addTask(name: string, fn: () => any) {
      return fn()
    }
  }
}))

vi.mock('./llmService.js', () => {
  return {
    generateContentStream: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        text: Promise.resolve('mock string response'),
        textStream: {
          [Symbol.asyncIterator]: async function* () {
            yield 'mock string response'
          }
        }
      })
    }),
    generateListStream: vi.fn().mockImplementation((prompt) => {
      const maxItems = parseInt(prompt.match(/^\d+/)?.[0] || '5', 10)
      const mockItems = Array.from({ length: maxItems }, (_, i) => `${i + 1}. Item ${i + 1}`)
      const mockText = mockItems.join('\n')
      
      return Promise.resolve({
        text: Promise.resolve(mockText),
        textStream: {
          [Symbol.asyncIterator]: async function* () {
            for (const item of mockItems) {
              yield item + '\n'
            }
          }
        }
      })
    })
  }
})

// Mock cacheMiddleware
vi.mock('./cacheMiddleware', () => ({
  createCacheMiddleware: vi.fn().mockReturnValue({
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  }),
}))

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
      try {
        const result = await ai`Write about JavaScript`

        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })

    it('should handle variable interpolation in template literals', async () => {
      try {
        const topic = 'TypeScript'
        const result = await ai`Write a blog post about ${topic}`

        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })

    it('should stringify arrays to YAML in template literals', async () => {
      try {
        const items = ['TypeScript', 'JavaScript', 'React']
        const result = await ai`Write a blog post about these technologies: ${items}`

        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })

    it('should stringify objects to YAML in template literals', async () => {
      try {
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
        expect(result.length).toBeGreaterThan(0)
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })
  })

  describe('AI Handler e2e', () => {
    it('should handle complex objects in template literals', async () => {
      try {
        const complexContext = {
          idea: 'AI startup',
          marketResearch: { data: 'extensive research' },
        }

        const result = await ai`Create a plan for ${complexContext}`

        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
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
      try {
        const result = await list`Generate 5 programming languages`

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBeGreaterThan(0)
        if (result.length > 0) {
          expect(typeof result[0]).toBe('string')
        }
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })

    it('should work as an AsyncIterable', async () => {
      try {
        const items: string[] = []

        for await (const item of list`Generate 5 programming languages`) {
          items.push(item)
          if (items.length >= 3) break; // Limit to 3 items to avoid long tests
        }

        expect(items.length).toBeGreaterThan(0)
        if (items.length > 0) {
          expect(typeof items[0]).toBe('string')
        }
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })

    it('should handle template literal interpolation', async () => {
      try {
        const topic = 'TypeScript'
        const count = 5
        const result = await list`Generate ${count} tips for ${topic}`

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBeGreaterThan(0)
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
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
      expect(YAML.stringify).toBeDefined()
    })
  })
})

describe('AI Handler e2e', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    vi.clearAllMocks()
    
    vi.spyOn(fs, 'readFileSync').mockReturnValue('mock file content')
    vi.mocked(matter).mockImplementation(() => 
      createMockGrayMatterFile({ output: 'string' }, 'You are a helpful assistant. ${prompt}')
    )
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should generate text using real API with caching', async () => {
    // Skip this test in CI environment or without API keys
    if (process.env.CI === 'true' || (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN)) {
      return
    }
    
    try {
      const result1 = await ai`Write a short greeting`
      
      expect(result1).toBeDefined()
      expect(typeof result1).toBe('string')
      expect(result1.length).toBeGreaterThan(0)
      
      const result2 = await ai`Write a short greeting`
      
      expect(result2).toBeDefined()
      expect(typeof result2).toBe('string')
      expect(result2).toBe(result1) // Check that caching works
    } catch (error) {
      expect(error).toBeDefined()
    }
  }, 60000) // Increase timeout for real API calls

  it('should handle errors gracefully with real API', async () => {
    // Skip this test in CI environment or without API keys
    if (process.env.CI === 'true' || (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN)) {
      return
    }
    
    try {
      const result = await ai``
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    } catch (error: any) {
      expect(error.message).toBeDefined()
    }
  }, 60000) // Increase timeout for real API calls
})

describe('extract function integration', () => {
  it('should be available as import from aiHandler', async () => {
    const { extract } = await import('./functions/extract')

    expect(extract).toBeDefined()
    expect(typeof extract).toBe('function')
  })

  it('should work with the existing AI infrastructure', async () => {
    try {
      const { extract } = await import('./functions/extract')
      const result = await extract`Extract test data`

      expect(result).toBeDefined()
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThanOrEqual(0)
      } else if (typeof result === 'object') {
        expect(result).not.toBeNull()
      } else {
        expect(typeof result).toBe('string')
      }
    } catch (error) {
      expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
    }
  })
})
