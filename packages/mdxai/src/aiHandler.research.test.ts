import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { research } from './aiHandler'
import * as ai from 'ai'
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
    
    vi.spyOn(ai, 'generateText').mockResolvedValue({
      text: 'Sample research text',
      response: {
        body: {
          citations: ['https://example.com'],
          choices: [{ message: { reasoning: 'Sample reasoning' } }]
        }
      }
    } as any)
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
    
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
    
    const result = await research`Research about ${topic}`

    expect(result).toBeDefined()
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('markdown')
    expect(result).toHaveProperty('citations')
    expect(result).toHaveProperty('scrapedCitations')
    
    expect(ai.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('TypeScript')
      })
    )
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
    
    expect(ai.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringMatching(/TypeScript.*JavaScript.*React/s)
      })
    )
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
    
    expect(ai.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringMatching(/MDX AI.*TypeScript.*React/s)
      })
    )
  })
})
