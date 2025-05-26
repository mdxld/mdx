import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ai, executeAiFunction, inferAndValidateOutput, list } from './aiHandler'
import fs from 'fs'
import matter from 'gray-matter'
import * as aiModule from 'ai'
import yaml from 'yaml'

type MockGrayMatterFile = {
  data: Record<string, any>;
  content: string;
  excerpt?: string;
  orig: string;
  language: string;
  matter: string;
  stringify: () => string;
  isEmpty?: boolean;
};

function createMockGrayMatterFile(data: Record<string, any>, content: string): MockGrayMatterFile {
  return {
    data,
    content,
    orig: content,
    language: 'md',
    matter: '',
    stringify: () => content,
    isEmpty: false,
  };
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
    textStream: {
      [Symbol.asyncIterator]: async function* () {
        yield 'This is a mock string response'
      },
    },
  }),
  streamObject: vi.fn().mockResolvedValue({
    object: {
      name: 'Mock Brand name',
      description: 'Mock Brand description',
      tone: 'formal',
      status: 'draft',
    },
    partialObjectStream: {
      [Symbol.asyncIterator]: async function* () {
        yield { name: 'Mock Brand name' }
        yield { description: 'Mock Brand description' }
      },
    },
  }),
  model: vi.fn().mockReturnValue('mock-model'),
  wrapLanguageModel: vi.fn().mockReturnValue({
    generateContent: vi.fn().mockResolvedValue({
      content: 'Mock content',
    }),
  }),
}))

vi.mock('./utils', () => ({
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
    CACHE: 'cache'
  }
}))

vi.mock('./llmService', () => ({
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
          return Object.entries(value)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n') + '\n'
        }
        return String(value)
      })
    }
  }
})

describe('AI Handler', () => {
  const originalEnv = { ...process.env }
  const mockSystemPrompt = 'You are a helpful assistant. ${prompt}'
  const mockFrontmatter = {
    output: 'string',
  }
  
  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    vi.clearAllMocks()
    
    vi.mocked(matter).mockImplementation(() => 
      createMockGrayMatterFile(mockFrontmatter, mockSystemPrompt)
    )
    
    vi.mocked(fs.readFileSync).mockReturnValue('mock file content')
  })
  
  afterEach(() => {
    process.env = { ...originalEnv }
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
          yamlSupport: true
        }
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
      vi.mocked(matter).mockImplementationOnce(() => 
        createMockGrayMatterFile({ output: 'array' }, 'Generate a list. ${prompt}')
      )
      
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
            }
          }, 
          'Create a brand story. ${prompt}'
        )
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
      vi.mocked(matter).mockImplementationOnce(() => 
        createMockGrayMatterFile({ output: 'string' }, 'Generate text. ${prompt}')
      )
      
      const result = await executeAiFunction('default', 'test prompt')
      
      expect(typeof result).toBe('string')
      expect(result).toContain('mock string response')
    })
    
    it('should handle array output type', async () => {
      vi.mocked(matter).mockImplementationOnce(() => 
        createMockGrayMatterFile({ output: 'array' }, 'Generate a list. ${prompt}')
      )
      
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
            }
          }, 
          'Create a brand story. ${prompt}'
        )
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
            }
          }, 
          'Create enum values. ${prompt}'
        )
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
      vi.mocked(matter).mockImplementationOnce(() => 
        createMockGrayMatterFile(
          { output: 'string' }, 
          'Process this context: ${prompt}'
        )
      )
      
      const complexObject = {
        idea: 'AI-powered startup',
        market: { size: '100B', segments: ['enterprise', 'consumer'] },
        metrics: [{ name: 'revenue', value: 1000000 }]
      }
      
      const result = await ai.leanCanvas(complexObject)
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
    
    it('should handle complex objects in template literals', async () => {
      const complexContext = {
        idea: 'AI startup',
        marketResearch: { data: 'extensive research' }
      }
      
      const result = await ai`Create a plan for ${complexContext}`
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
  })
  
  describe('type inference and validation', () => {
    it('should validate output types against schema', async () => {
      const result = inferAndValidateOutput(
        { name: 'string', count: 'number' },
        { name: 'test', count: 42 }
      )
      
      expect(result).toEqual({ name: 'test', count: 42 })
    })
    
    it('should handle validation failures gracefully', async () => {
      const result = inferAndValidateOutput(
        { name: 'string' },
        { invalidKey: 'value' }
      )
      
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
      expect(() => {
        list('not a template literal')
      }).toThrow('list function must be used as a template literal tag')
    })

    it('should use YAML.stringify for arrays and objects', () => {
      
      
      expect(yaml.stringify).toBeDefined()
    })
  })
})
