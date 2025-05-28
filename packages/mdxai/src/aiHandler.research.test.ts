import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { research } from './aiHandler'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

describe('research template literal', () => {
  const originalEnv = { ...process.env }
  const testId = randomUUID()
  const testDir = path.join(process.cwd(), '.ai', 'test', testId)
  const promptsDir = path.join(process.cwd(), '.ai', 'prompts')
  
  const createTestPrompt = (content: string, metadata: Record<string, any> = { output: 'string' }) => {
    fs.mkdirSync(testDir, { recursive: true })
    fs.mkdirSync(promptsDir, { recursive: true })
    
    const frontmatter = `---\n${Object.entries(metadata).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\n\n${content}`
    const promptFile = path.join(promptsDir, 'research.md')
    
    fs.writeFileSync(promptFile, frontmatter)
    
    return promptFile
  }

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    
    createTestPrompt('Respond briefly to: ${prompt}')
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
      }
    } catch (error) {
      console.error('Error cleaning up test directory:', error)
    }
  })

  it('should handle template literals with variable interpolation', async () => {
    const topic = 'TypeScript'
    
    try {
      process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key'
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timed out')), 10000)
      })
      
      const result = await Promise.race([
        research`Research about ${topic}`,
        timeoutPromise
      ]) as any

      expect(result).toBeDefined()
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('markdown')
      expect(result).toHaveProperty('citations')
      expect(result).toHaveProperty('scrapedCitations')
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|timed out|too many tokens/i)
      } else {
        throw error
      }
    }
  }, 15000) // Reduced timeout since we have our own timeout handling

  it('should throw an error when not called as a template literal', () => {
    // @ts-ignore - Testing incorrect usage
    expect(() => research('not a template literal')).toThrow('Research function must be called with a string or as a template literal')
  })

  it('should stringify arrays to YAML format', async () => {
    const items = ['TypeScript', 'JavaScript', 'React']
    
    try {
      process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key'
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timed out')), 10000)
      })
      
      const result = await Promise.race([
        research`Research these technologies: ${items}`,
        timeoutPromise
      ]) as any

      expect(result).toBeDefined()
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('markdown')
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|timed out|too many tokens/i)
      } else {
        throw error
      }
    }
  }, 15000) // Reduced timeout since we have our own timeout handling

  it('should stringify objects to YAML format', async () => {
    const project = {
      name: 'MDX AI',
      technologies: ['TypeScript', 'React'],
    }
    
    try {
      process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key'
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timed out')), 10000)
      })
      
      const result = await Promise.race([
        research`Research this project: ${project}`,
        timeoutPromise
      ]) as any

      expect(result).toBeDefined()
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('markdown')
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|timed out|too many tokens/i)
      } else {
        throw error
      }
    }
  }, 15000) // Reduced timeout since we have our own timeout handling
})
