import { describe, expect, it } from 'vitest'
import { extract } from './extract'

// Entity relationship test from main branch
describe('extract', () => {
  it('should extract entities and relationships', async () => {
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
            "observations": [],
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
  })
})

// Basic tests for the new extract function implementation
describe('extract function basic usage', () => {
  it('should extract entities and relationships from text', async () => {
    const text = 'John Doe works at Microsoft in New York'
    
    const result = await extract`Extract all person names from: ${text}`

    expect(result).toBeDefined()
    expect(result.entities).toBeDefined()
    expect(Array.isArray(result.entities)).toBe(true)
    expect(result.relationships).toBeDefined()
    expect(Array.isArray(result.relationships)).toBe(true)
  })

  it('should handle variable interpolation', async () => {
    const document = 'Sample document with data'
    
    const result = await extract`Extract important information from: ${document}`

    expect(result).toBeDefined()
    expect(result.entities).toBeDefined()
    expect(result.relationships).toBeDefined()
  })
})

describe('extract function error handling', () => {
  it('should throw error when not used as template literal', async () => {
    // @ts-expect-error - intentionally testing runtime error when used incorrectly
    await expect(extract('not a template literal')).rejects.toThrow('extract function must be used as a template literal tag')
  })

  it('should support Promise methods', async () => {
    const result = extract`Extract from: test`

    expect(typeof result.then).toBe('function')
    expect(typeof result.catch).toBe('function')
    expect(typeof result.finally).toBe('function')
  })
})

describe('extract function e2e', () => {
  it('should extract entities from text using real API with caching', async () => {
    const text = 'Apple Inc. was founded by Steve Jobs in California'
    
    const result1 = await extract`Extract all entities from: ${text}`
    
    expect(result1).toBeDefined()
    expect(result1.entities).toBeDefined()
    expect(Array.isArray(result1.entities)).toBe(true)
    
    if (result1.entities.length > 0) {
      const result2 = await extract`Extract all entities from: ${text}`
      
      expect(result2).toBeDefined()
      expect(result2.entities).toBeDefined()
      expect(Array.isArray(result2.entities)).toBe(true)
    }
  })

  it('should handle errors gracefully with real API', async () => {
    const text = ''
    
    const result = await extract`Extract entities from: ${text}`
    
    expect(result).toBeDefined()
    expect(result.entities).toBeDefined()
    expect(Array.isArray(result.entities)).toBe(true)
    expect(result.entities.length).toBeLessThanOrEqual(10)
  })
})
