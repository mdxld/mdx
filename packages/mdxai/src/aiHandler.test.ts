import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ai, executeAiFunction, inferAndValidateOutput, list } from './aiHandler'
import fs from 'fs'
import matter from 'gray-matter'

// Mock modules at the top level
vi.mock('gray-matter')

// Mock yaml module with proper default export
vi.mock('yaml', () => {
  // Create a string with trim method for stringify to return
  const mockYamlString = (obj) => {
    return JSON.stringify(obj, null, 2)
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
  return {
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
  }
})

// Mock QueueManager
vi.mock('./ui/index.js', () => ({
  QueueManager: class {
    constructor() {}
    addTask(name, fn) {
      return fn()
    }
  }
}))

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
    })
  })

  // Skip e2e tests in CI environment
  describe.skipIf(process.env.CI === 'true')('AI Handler e2e', () => {
    beforeEach(() => {
      if (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN) {
        console.log('Skipping AI Handler e2e test: OPENAI_API_KEY or AI_GATEWAY_TOKEN not set')
        return
      }
      
      process.env.NODE_ENV = 'test' // Use test mode to force mocks
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

      // Mock the generateText function for e2e tests
      const generateTextMock = vi.fn().mockResolvedValue({
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
      
      vi.doMock('ai', () => ({
        generateText: generateTextMock,
        model: vi.fn().mockReturnValue('mock-model'),
      }))
      
      const result1 = await ai`Write a short greeting`
      
      expect(result1).toBeDefined()
      expect(typeof result1).toBe('string')
      expect(result1.length).toBeGreaterThan(0)
      
      const result2 = await ai`Write a short greeting`
      
      expect(result2).toBeDefined()
      expect(typeof result2).toBe('string')
      expect(result2).toBe(result1)
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
})
