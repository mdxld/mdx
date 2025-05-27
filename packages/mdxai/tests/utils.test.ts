import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { join } from 'path'

vi.mock('fs', () => {
  const mockFs = {
    existsSync: vi.fn().mockReturnValue(false),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue('{}'),
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
  return mockFs
})

import * as fs from 'fs'
import { 
  AI_FOLDER_STRUCTURE, 
  extractH1Title,
  slugifyString
} from '../src/utils.js'

describe('mdxai utils', () => {
  const TEST_DIR = join(process.cwd(), '.ai-test')
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('AI folder structure', () => {
    it('should have correct folder structure constants', () => {
      expect(AI_FOLDER_STRUCTURE).toEqual({
        ROOT: '.ai',
        FUNCTIONS: 'functions',
        TEMPLATES: 'templates',
        VERSIONS: 'versions',
        CACHE: 'cache',
      })
    })
  })
  
  describe('content extraction', () => {
    it('should extract H1 title from markdown content', () => {
      const content = '# Test Title\n\nSome content'
      const title = extractH1Title(content)
      expect(title).toBe('Test Title')
    })
    
    it('should return null when no H1 title is found', () => {
      const content = 'No title here\n\nJust content'
      const title = extractH1Title(content)
      expect(title).toBeNull()
    })
    
    it('should handle multiple H1 titles and return the first one', () => {
      const content = '# First Title\n\nSome content\n\n# Second Title'
      const title = extractH1Title(content)
      expect(title).toBe('First Title')
    })
  })
  
  describe('.ai folder schema tests', () => {
    it('should handle .ai folder paths correctly', async () => {
      const functionPath = join(TEST_DIR, AI_FOLDER_STRUCTURE.ROOT, AI_FOLDER_STRUCTURE.FUNCTIONS, 'testFunction.md')
      const templatePath = join(TEST_DIR, AI_FOLDER_STRUCTURE.ROOT, AI_FOLDER_STRUCTURE.TEMPLATES, 'testTemplate.md')
      
      expect(functionPath).toContain('.ai/functions/testFunction.md')
      expect(templatePath).toContain('.ai/templates/testTemplate.md')
    })
    
    it('should slugify strings for function names', () => {
      expect(slugifyString('Test Function')).toBe('test-function')
      expect(slugifyString('Complex AI Function Name')).toBe('complex-ai-function-name')
      expect(slugifyString('camelCaseFunction')).toBe('camelcasefunction')
    })
  })
})
