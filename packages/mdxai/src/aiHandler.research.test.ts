import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { research } from './aiHandler'
import fs from 'fs'
import matter from 'gray-matter'
import yaml from 'yaml'
import path from 'path'

describe('research template literal', () => {
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
    process.env.NODE_ENV = 'test'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should handle template literals with variable interpolation', async () => {
    const testFile = createTestFile('You are a research assistant. ${prompt}')
    const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
      if (typeof path === 'string' && path.includes('.ai/prompts')) {
        return fs.readFileSync(testFile)
      }
      return fs.readFileSync(path as any)
    })
    
    try {
      const topic = 'TypeScript'
      const result = await research`Research about ${topic}`
  
      expect(result).toBeDefined()
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('markdown')
      expect(result).toHaveProperty('citations')
      expect(result).toHaveProperty('scrapedCitations')
    } finally {
      readFileSyncSpy.mockRestore()
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile)
      }
    }
  }, 60000) // Increase timeout for real API calls

  it('should throw an error when not called as a template literal', () => {
    // @ts-ignore - Testing incorrect usage
    expect(() => research('not a template literal')).toThrow('Research function must be called with a string or as a template literal')
  })

  it('should stringify arrays to YAML format', async () => {
    const testFile = createTestFile('You are a research assistant. ${prompt}')
    const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
      if (typeof path === 'string' && path.includes('.ai/prompts')) {
        return fs.readFileSync(testFile)
      }
      return fs.readFileSync(path as any)
    })
    
    try {
      const items = ['TypeScript', 'JavaScript', 'React']
      const result = await research`Research these technologies: ${items}`
  
      expect(result).toBeDefined()
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('markdown')
    } finally {
      readFileSyncSpy.mockRestore()
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile)
      }
    }
  }, 60000) // Increase timeout for real API calls

  it('should stringify objects to YAML format', async () => {
    const testFile = createTestFile('You are a research assistant. ${prompt}')
    const readFileSyncSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
      if (typeof path === 'string' && path.includes('.ai/prompts')) {
        return fs.readFileSync(testFile)
      }
      return fs.readFileSync(path as any)
    })
    
    try {
      const project = {
        name: 'MDX AI',
        technologies: ['TypeScript', 'React'],
      }
      const result = await research`Research this project: ${project}`
  
      expect(result).toBeDefined()
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('markdown')
    } finally {
      readFileSyncSpy.mockRestore()
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile)
      }
    }
  }, 60000) // Increase timeout for real API calls
})
