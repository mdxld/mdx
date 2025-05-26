import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ai, executeAiFunction } from './aiHandler'
import fs from 'fs'
import matter from 'gray-matter'
import * as aiModule from 'ai'

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
  })
  
  describe('ai function properties', () => {
    it('should handle named functions with template literals', async () => {
      vi.mocked(matter).mockImplementationOnce(() => 
        createMockGrayMatterFile({ output: 'array' }, 'Generate a list. ${prompt}')
      )
      
      const result = await ai.list`Generate 3 blog post ideas`
      
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
})
