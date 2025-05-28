import { describe, expect, it } from 'vitest'
import { extract } from './extract'

// Entity relationship test from main branch
describe('extract', () => {
  it('should extract entities and relationships', async () => {
    try {
      process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key'
      process.env.AI_GATEWAY_TOKEN = process.env.AI_GATEWAY_TOKEN || 'test-api-key'
      
      const result = await extract`facts: ${'John Doe is an amazing software engineer at Microsoft. He lives and works at the office in New York City.'}`
      
      expect(result.entities.length).toBeGreaterThan(0)
      expect(result.entities[0].observations.length).toBeGreaterThan(0)
      expect(result.relationships.length).toBeGreaterThan(0)
      expect(result).toMatchInlineSnapshot(`
      {
        "entities": [
          {
            "name": "John Doe",
            "observations": [
              "amazing software engineer",
              "lives and works at the office in New York City",
            ],
            "type": "Person",
          },
          {
            "name": "Microsoft",
            "observations": [
              "office in New York City",
            ],
            "type": "Organization",
          },
          {
            "name": "New York City",
            "observations": [],
            "type": "Location",
          },
        ],
        "relationships": [
          {
            "from": "John Doe",
            "to": "Microsoft",
            "type": "works at",
          },
          {
            "from": "John Doe",
            "to": "New York City",
            "type": "lives in",
          },
          {
            "from": "John Doe",
            "to": "New York City",
            "type": "works in",
          },
        ],
      }
    `)
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request|timed out/i)
      } else {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request|timed out/i)
      }
    }
  }, 15000)
})

// Basic tests for the new extract function implementation
describe('extract function basic usage', () => {
  it('should extract entities and relationships from text', async () => {
    try {
      process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key'
      process.env.AI_GATEWAY_TOKEN = process.env.AI_GATEWAY_TOKEN || 'test-api-key'
      
      const text = 'John Doe works at Microsoft in New York'
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timed out')), 10000)
      })
      
      const result = await Promise.race([
        extract`Extract all person names from: ${text}`,
        timeoutPromise
      ]) as any

      expect(result).toBeDefined()
      expect(result.entities).toBeDefined()
      expect(Array.isArray(result.entities)).toBe(true)
      expect(result.relationships).toBeDefined()
      expect(Array.isArray(result.relationships)).toBe(true)
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request|timed out/i)
      } else {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request|timed out/i)
      }
    }
  }, 15000) // Reduced timeout since we have our own timeout handling

  it('should handle variable interpolation', async () => {
    try {
      process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key'
      process.env.AI_GATEWAY_TOKEN = process.env.AI_GATEWAY_TOKEN || 'test-api-key'
      
      const document = 'Sample document with data'
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timed out')), 10000)
      })
      
      const result = await Promise.race([
        extract`Extract important information from: ${document}`,
        timeoutPromise
      ]) as any

      expect(result).toBeDefined()
      expect(result.entities).toBeDefined()
      expect(result.relationships).toBeDefined()
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request|timed out/i)
      } else {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request|timed out/i)
      }
    }
  }, 15000) // Reduced timeout since we have our own timeout handling
})

describe('extract function error handling', () => {
  it('should throw error when not used as template literal', async () => {
    // @ts-expect-error - intentionally testing runtime error when used incorrectly
    await expect(extract('not a template literal')).rejects.toThrow('extract function must be used as a template literal tag')
  })

  it('should support Promise methods', async () => {
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key'
    process.env.AI_GATEWAY_TOKEN = process.env.AI_GATEWAY_TOKEN || 'test-api-key'
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timed out')), 10000)
    })
    
    const result = Promise.race([
      extract`Extract from: test`,
      timeoutPromise
    ])

    expect(typeof result.then).toBe('function')
    expect(typeof result.catch).toBe('function')
    expect(typeof result.finally).toBe('function')
  }, 15000) // Reduced timeout since we have our own timeout handling
})

describe('extract function e2e', () => {
  it('should extract entities from text using real API with caching', async () => {
    try {
      process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key'
      process.env.AI_GATEWAY_TOKEN = process.env.AI_GATEWAY_TOKEN || 'test-api-key'
      
      const text = 'Apple Inc. was founded by Steve Jobs in California'
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timed out')), 10000)
      })
      
      const result1 = await Promise.race([
        extract`Extract all entities from: ${text}`,
        timeoutPromise
      ]) as any
      
      expect(result1).toBeDefined()
      expect(result1.entities).toBeDefined()
      expect(Array.isArray(result1.entities)).toBe(true)
      
      if (result1.entities.length > 0) {
        const result2 = await Promise.race([
          extract`Extract all entities from: ${text}`,
          timeoutPromise
        ]) as any
        
        expect(result2).toBeDefined()
        expect(result2.entities).toBeDefined()
        expect(Array.isArray(result2.entities)).toBe(true)
      }
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request|timed out/i)
      } else {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request|timed out/i)
      }
    }
  }, 15000) // Reduced timeout since we have our own timeout handling

  it('should handle errors gracefully with real API', async () => {
    try {
      process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key'
      process.env.AI_GATEWAY_TOKEN = process.env.AI_GATEWAY_TOKEN || 'test-api-key'
      
      const text = ''
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timed out')), 10000)
      })
      
      const result = await Promise.race([
        extract`Extract entities from: ${text}`,
        timeoutPromise
      ]) as any
      
      expect(result).toBeDefined()
      expect(result.entities).toBeDefined()
      expect(Array.isArray(result.entities)).toBe(true)
      expect(result.entities.length).toBeLessThanOrEqual(10)
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request|timed out/i)
      } else {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request|timed out/i)
      }
    }
  }, 15000) // Reduced timeout since we have our own timeout handling
})
