import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { join } from 'path'

vi.mock('fs', () => {
  const mockFs = {
    existsSync: vi.fn().mockReturnValue(false),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue('---\noutput: string\n---\nThis is a dynamic function template. ${prompt}'),
    statSync: vi.fn().mockReturnValue({ birthtime: new Date() }),
    readdirSync: vi.fn().mockReturnValue([]),
    promises: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      rm: vi.fn().mockResolvedValue(undefined),
      readdir: vi.fn().mockResolvedValue([]),
      readFile: vi.fn().mockResolvedValue(''),
      stat: vi.fn().mockResolvedValue({ mtime: { getTime: () => Date.now() } }),
      unlink: vi.fn().mockResolvedValue(undefined),
    }
  }
  return {
    ...mockFs,
    default: mockFs
  }
})

vi.mock('gray-matter', () => {
  return {
    default: vi.fn().mockImplementation((content) => {
      return {
        data: { output: 'string' },
        content: 'This is a dynamic function template. ${prompt}',
      }
    })
  }
})

vi.mock('../src/utils.js', () => ({
  findAiFunction: vi.fn(),
  findAiFunctionEnhanced: vi.fn(),
  ensureAiFunctionExists: vi.fn().mockImplementation((functionName) => {
    return `/path/to/.ai/functions/${functionName}.md`;
  }),
  writeAiFunction: vi.fn(),
  AI_FOLDER_STRUCTURE: {
    ROOT: '.ai',
    FUNCTIONS: 'functions',
    TEMPLATES: 'templates',
    VERSIONS: 'versions',
    CACHE: 'cache',
  }
}))

vi.mock('ai', () => {
  return {
    generateText: vi.fn().mockResolvedValue({
      text: 'Mock AI response',
    }),
    streamText: vi.fn().mockResolvedValue({
      textStream: {
        [Symbol.asyncIterator]: async function* () {
          yield 'Mock AI response'
        }
      }
    }),
    model: vi.fn().mockReturnValue('mock-model'),
  }
})

import * as fs from 'fs'
import { findAiFunction, findAiFunctionEnhanced, ensureAiFunctionExists, writeAiFunction } from '../src/utils.js'
import { executeAiFunction } from '../src/aiHandler.js'
import matter from 'gray-matter'

describe('mdxai aiHandler schema tests', () => {
  const TEST_DIR = join(process.cwd(), '.ai-test')
  
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = 'test'
  })
  
  afterEach(() => {
    vi.clearAllMocks()
    delete process.env.NODE_ENV
  })

  describe('.ai folder schema tests', () => {
    it('should create dynamic functions from .ai folder structure', async () => {
      vi.mocked(findAiFunctionEnhanced).mockResolvedValueOnce({
        filePath: join(TEST_DIR, '.ai/functions/dynamicFunction.md'),
        content: '---\noutput: string\n---\nThis is a dynamic function template. ${prompt}',
      })
      
      const result = await executeAiFunction('dynamicFunction', 'test prompt')
      
      expect(findAiFunctionEnhanced).toHaveBeenCalledWith('dynamicFunction')
      expect(result).toBeDefined()
    })
    
    it('should create new functions when they don\'t exist', async () => {
      vi.mocked(findAiFunctionEnhanced).mockResolvedValueOnce(null)
      vi.mocked(findAiFunctionEnhanced).mockResolvedValueOnce({
        filePath: join(TEST_DIR, '.ai/functions/newFunction.md'),
        content: '---\noutput: string\n---\nThis is a new function template. ${prompt}',
      })
      
      const result = await executeAiFunction('newFunction', 'test prompt')
      
      expect(findAiFunctionEnhanced).toHaveBeenCalledWith('newFunction')
      expect(ensureAiFunctionExists).toHaveBeenCalledWith('newFunction')
      expect(result).toBeDefined()
    })
  })
})
