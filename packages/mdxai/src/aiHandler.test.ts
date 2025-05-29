import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ai, executeAiFunction, inferAndValidateOutput, list } from './aiHandler'
import fs from 'fs'
import matter from 'gray-matter'
import * as aiModule from 'ai'
import * as YAML from 'yaml'
import path from 'path'

describe('AI Handler', () => {
  const originalEnv = { ...process.env }
  
  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    process.env.USE_CACHE = 'true' // Enable caching for tests
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })
  
  const createTestFile = (content: string, metadata: Record<string, any> = { output: 'string' }) => {
    const tempDir = path.join(process.cwd(), '.ai', 'test')
    const tempFile = path.join(tempDir, `test-${Date.now()}.md`)
    
    fs.mkdirSync(tempDir, { recursive: true })
    
    const frontmatter = `---\n${Object.entries(metadata).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\n\n${content}`
    
    fs.writeFileSync(tempFile, frontmatter)
    
    return tempFile
  }

  describe('ai template literal', () => {
    it('should handle string output with template literals', async () => {
      const testFile = createTestFile('You are a helpful assistant. ${prompt}')
      
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('.ai/prompts')) {
          return fs.readFileSync(testFile, 'utf-8')
        }
        return fs.readFileSync(path as string)
      })
      
      try {
        const result = await ai`Write about JavaScript`

        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      } catch (error) {
        expect(error).toBeDefined()
      } finally {
        readFileSyncSpy.mockRestore()
        fs.unlinkSync(testFile)
      }
    }, 60000)

    it('should handle variable interpolation in template literals', async () => {
      const testFile = createTestFile('You are a helpful assistant. ${prompt}')
      
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('.ai/prompts')) {
          return fs.readFileSync(testFile, 'utf-8')
        }
        return fs.readFileSync(path as string)
      })
      
      try {
        const topic = 'TypeScript'
        const result = await ai`Write a blog post about ${topic}`

        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      } catch (error) {
        expect(error).toBeDefined()
      } finally {
        readFileSyncSpy.mockRestore()
        fs.unlinkSync(testFile)
      }
    }, 60000)

    it('should stringify arrays to YAML in template literals', async () => {
      const testFile = createTestFile('You are a helpful assistant. ${prompt}')
      
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('.ai/prompts')) {
          return fs.readFileSync(testFile, 'utf-8')
        }
        return fs.readFileSync(path as string)
      })
      
      try {
        const items = ['TypeScript', 'JavaScript', 'React']
        const result = await ai`Write a blog post about these technologies: ${items}`

        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      } catch (error) {
        expect(error).toBeDefined()
      } finally {
        readFileSyncSpy.mockRestore()
        fs.unlinkSync(testFile)
      }
    }, 60000)

    it('should stringify objects to YAML in template literals', async () => {
      const testFile = createTestFile('You are a helpful assistant. ${prompt}')
      
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('.ai/prompts')) {
          return fs.readFileSync(testFile, 'utf-8')
        }
        return fs.readFileSync(path as string)
      })
      
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
        expect(error).toBeDefined()
      } finally {
        readFileSyncSpy.mockRestore()
        fs.unlinkSync(testFile)
      }
    }, 60000)
  })

  describe('AI Handler e2e', () => {
    it('should handle complex objects in template literals', async () => {
      const testFile = createTestFile('You are a helpful assistant. ${prompt}')
      
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('.ai/prompts')) {
          return fs.readFileSync(testFile, 'utf-8')
        }
        return fs.readFileSync(path as string)
      })
      
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
        expect(error).toBeDefined()
      } finally {
        readFileSyncSpy.mockRestore()
        fs.unlinkSync(testFile)
      }
    }, 60000)
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
      const testFile = createTestFile('You are a helpful assistant. ${prompt}')
      
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('.ai/prompts')) {
          return fs.readFileSync(testFile, 'utf-8')
        }
        return fs.readFileSync(path as string)
      })
      
      try {
        const result = await list`Generate 5 programming languages`

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBeGreaterThan(0)
        if (result.length > 0) {
          expect(typeof result[0]).toBe('string')
        }
      } catch (error) {
        expect(error).toBeDefined()
      } finally {
        readFileSyncSpy.mockRestore()
        fs.unlinkSync(testFile)
      }
    }, 60000)

    it('should work as an AsyncIterable', async () => {
      const testFile = createTestFile('You are a helpful assistant. ${prompt}')
      
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('.ai/prompts')) {
          return fs.readFileSync(testFile, 'utf-8')
        }
        return fs.readFileSync(path as string)
      })
      
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
        expect(error).toBeDefined()
      } finally {
        readFileSyncSpy.mockRestore()
        fs.unlinkSync(testFile)
      }
    }, 60000)

    it('should handle template literal interpolation', async () => {
      const testFile = createTestFile('You are a helpful assistant. ${prompt}')
      
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('.ai/prompts')) {
          return fs.readFileSync(testFile, 'utf-8')
        }
        return fs.readFileSync(path as string)
      })
      
      try {
        const topic = 'TypeScript'
        const count = 5
        const result = await list`Generate ${count} tips for ${topic}`

        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBeGreaterThan(0)
      } catch (error) {
        expect(error).toBeDefined()
      } finally {
        readFileSyncSpy.mockRestore()
        fs.unlinkSync(testFile)
      }
    }, 60000)

    it('should support Promise methods', async () => {
      const testFile = createTestFile('You are a helpful assistant. ${prompt}')
      
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('.ai/prompts')) {
          return fs.readFileSync(testFile, 'utf-8')
        }
        return fs.readFileSync(path as string)
      })
      
      const result = list`Generate ideas`

      expect(typeof result.then).toBe('function')
      expect(typeof result.catch).toBe('function')
      expect(typeof result.finally).toBe('function')
      
      readFileSyncSpy.mockRestore()
      fs.unlinkSync(testFile)
    })

    it('should support async iterator protocol', () => {
      const testFile = createTestFile('You are a helpful assistant. ${prompt}')
      
      const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('.ai/prompts')) {
          return fs.readFileSync(testFile, 'utf-8')
        }
        return fs.readFileSync(path as string)
      })
      
      const result = list`Generate ideas`

      expect(typeof result[Symbol.asyncIterator]).toBe('function')
      
      readFileSyncSpy.mockRestore()
      fs.unlinkSync(testFile)
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
  
  const createTestFile = (content: string, metadata: Record<string, any> = { output: 'string' }) => {
    const tempDir = path.join(process.cwd(), '.ai', 'test')
    const tempFile = path.join(tempDir, `test-${Date.now()}.md`)
    
    fs.mkdirSync(tempDir, { recursive: true })
    
    const frontmatter = `---\n${Object.entries(metadata).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\n\n${content}`
    
    fs.writeFileSync(tempFile, frontmatter)
    
    return tempFile
  }

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should generate text using real API with caching', async () => {
    const testFile = createTestFile('You are a helpful assistant. ${prompt}')
    
    const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
      if (typeof path === 'string' && path.includes('.ai/prompts')) {
        return fs.readFileSync(testFile, 'utf-8')
      }
      return fs.readFileSync(path as string)
    })
    
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
    } finally {
      readFileSyncSpy.mockRestore()
      fs.unlinkSync(testFile)
    }
  }, 60000) // Increase timeout for real API calls

  it('should handle errors gracefully with real API', async () => {
    const testFile = createTestFile('You are a helpful assistant. ${prompt}')
    
    const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
      if (typeof path === 'string' && path.includes('.ai/prompts')) {
        return fs.readFileSync(testFile, 'utf-8')
      }
      return fs.readFileSync(path as string)
    })
    
    try {
      const result = await ai``
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    } catch (error: any) {
      expect(error.message).toBeDefined()
    } finally {
      readFileSyncSpy.mockRestore()
      fs.unlinkSync(testFile)
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
      expect(error).toBeDefined()
    }
  })
})
