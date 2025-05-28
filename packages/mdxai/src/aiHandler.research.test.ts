import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { research } from './aiHandler'
import fs from 'fs'
import matter from 'gray-matter'
import yaml from 'yaml'
import * as aiModule from 'ai'

// Mock modules at the top level
vi.mock('gray-matter')

// Mock yaml module with proper default export
vi.mock('yaml', async () => {
  const stringify = vi.fn().mockImplementation((obj) => JSON.stringify(obj, null, 2))
  const parse = vi.fn().mockImplementation((str) => JSON.parse(str))
  
  return {
    default: {
      stringify,
      parse
    },
    stringify,
    parse
  }
})

// Mock ai module with proper response structure
vi.mock('ai', () => {
  return {
    generateText: vi.fn().mockResolvedValue({
      text: 'This is a test response with citation [1] and another citation [2].',
      response: {
        body: {
          citations: ['https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data', 'https://vercel.com/docs/ai-sdk'],
          choices: [
            {
              message: {
                reasoning: 'This is mock reasoning',
                content: 'mock string response'
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

vi.mock('./functions/research.js', () => {
  const mockResearchResult = {
    text: 'This is a test research response',
    markdown: '# Research Results\n\nThis is a test research response with citations [ ¹ ](#1)',
    citations: ['https://example.com/citation1'],
    reasoning: 'This is mock reasoning',
    scrapedCitations: [
      {
        url: 'https://example.com/citation1',
        title: 'Test Citation',
        description: 'Test Description',
        markdown: '# Test Citation\n\nThis is test content',
      },
    ],
  }

  const researchFunction = (queryOrTemplate: any, ...values: any[]) => {
    if (typeof queryOrTemplate === 'string') {
      throw new Error('Research function must be called with a string or as a template literal')
    }
    
    if (Array.isArray(queryOrTemplate) && 'raw' in queryOrTemplate) {
      for (const value of values) {
        if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
          yaml.stringify(value)
        }
      }
    }
    
    return Promise.resolve(mockResearchResult)
  }

  return {
    research: new Proxy(researchFunction, {
      apply(target: any, thisArg: any, args: any[]) {
        return target.apply(thisArg, args)
      }
    })
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

// Mock scrape function
vi.mock('./functions/scrape.js', () => ({
  scrape: vi.fn().mockImplementation((url) => {
    return {
      url,
      title: `Content from ${new URL(url).hostname}`,
      description: `Description from ${new URL(url).hostname}`,
      markdown: '# Test Markdown\nThis is test content',
      cached: false
    }
  }),
  ScrapedContent: class {}
}))

// Mock gray-matter file
function createMockGrayMatterFile(data: Record<string, any>, content: string) {
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

describe('research template literal', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    vi.clearAllMocks()
    
    vi.spyOn(fs, 'readFileSync').mockReturnValue('mock file content')
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    
    vi.mocked(matter).mockImplementation(() => 
      createMockGrayMatterFile({ output: 'string' }, 'You are a research assistant. ${prompt}')
    )
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should handle template literals with variable interpolation', async () => {
    const topic = 'TypeScript'
    const result = await research`Research about ${topic}`

    expect(result).toBeDefined()
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('markdown')
    expect(result).toHaveProperty('citations')
    expect(result).toHaveProperty('scrapedCitations')
  })

  it('should throw an error when not called as a template literal', () => {
    // @ts-ignore - Testing incorrect usage
    expect(() => research('not a template literal')).toThrow('Research function must be called with a string or as a template literal')
  })

  it('should stringify arrays to YAML format', async () => {
    const items = ['TypeScript', 'JavaScript', 'React']
    const result = await research`Research these technologies: ${items}`

    expect(result).toBeDefined()
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('markdown')
    expect(yaml.stringify).toHaveBeenCalledWith(items)
  })

  it('should stringify objects to YAML format', async () => {
    const project = {
      name: 'MDX AI',
      technologies: ['TypeScript', 'React'],
    }
    const result = await research`Research this project: ${project}`

    expect(result).toBeDefined()
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('markdown')
    expect(yaml.stringify).toHaveBeenCalledWith(project)
  })
})
