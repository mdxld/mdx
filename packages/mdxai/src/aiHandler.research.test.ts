import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { research } from './aiHandler'
import fs from 'fs'
import matter from 'gray-matter'
import yaml from 'yaml'
import * as aiModule from 'ai'

function createGrayMatterFile(data: Record<string, any>, content: string) {
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
    
    vi.spyOn(fs, 'readFileSync').mockReturnValue('file content')
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    
    vi.spyOn(matter as any, 'default').mockImplementation(() => 
      createGrayMatterFile({ output: 'string' }, 'You are a research assistant. ${prompt}')
    )
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should handle template literals with variable interpolation', async () => {
    if (process.env.CI === 'true' || (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN)) {
      return
    }
    
    const topic = 'TypeScript'
    const result = await research`Research about ${topic}`

    expect(result).toBeDefined()
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('markdown')
    expect(result).toHaveProperty('citations')
    expect(result).toHaveProperty('scrapedCitations')
  }, 60000) // Increase timeout for real API calls

  it('should throw an error when not called as a template literal', () => {
    // @ts-ignore - Testing incorrect usage
    expect(() => research('not a template literal')).toThrow('Research function must be called with a string or as a template literal')
  })

  it('should stringify arrays to YAML format', async () => {
    if (process.env.CI === 'true' || (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN)) {
      return
    }
    
    const yamlSpy = vi.spyOn(yaml, 'stringify')
    
    try {
      const items = ['TypeScript', 'JavaScript', 'React']
      const result = await research`Research these technologies: ${items}`
  
      expect(result).toBeDefined()
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('markdown')
      expect(yamlSpy).toHaveBeenCalled()
    } finally {
      yamlSpy.mockRestore()
    }
  }, 60000) // Increase timeout for real API calls

  it('should stringify objects to YAML format', async () => {
    if (process.env.CI === 'true' || (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN)) {
      return
    }
    
    const yamlSpy = vi.spyOn(yaml, 'stringify')
    
    try {
      const project = {
        name: 'MDX AI',
        technologies: ['TypeScript', 'React'],
      }
      const result = await research`Research this project: ${project}`
  
      expect(result).toBeDefined()
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('markdown')
      expect(yamlSpy).toHaveBeenCalled()
    } finally {
      yamlSpy.mockRestore()
    }
  }, 60000) // Increase timeout for real API calls
})
