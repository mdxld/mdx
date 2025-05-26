import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { extract } from './extract'

vi.mock('../ai.js', () => ({
  model: vi.fn().mockReturnValue('mock-model')
}))

vi.mock('ai', () => ({
  streamText: vi.fn().mockResolvedValue({
    textStream: {
      [Symbol.asyncIterator]: async function* () {
        yield '1. John Doe\n2. Microsoft\n3. New York'
      },
    },
  }),
  streamObject: vi.fn().mockResolvedValue({
    object: {
      name: 'Test Product',
      price: 99.99,
      features: ['Feature 1', 'Feature 2']
    }
  })
}))

describe('extract function', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('basic template literal usage', () => {
    it('should extract entities by default', async () => {
      const text = 'John Doe works at Microsoft in New York'
      const result = await extract`Extract all person names from: ${text}`

      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual(['John Doe', 'Microsoft', 'New York'])
    })

    it('should handle variable interpolation', async () => {
      const document = 'Sample document with data'
      const result = await extract`Extract important information from: ${document}`

      expect(result).toBeDefined()
    })
  })

  describe('type-specific extraction', () => {
    it('should extract entities when using asType("entity")', async () => {
      const text = 'Apple Inc. was founded by Steve Jobs'
      const result = await extract`Extract entities from: ${text}`.asType('entity')

      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual(['John Doe', 'Microsoft', 'New York'])
    })

    it('should extract dates when using asType("date")', async () => {
      const text = 'The meeting is on January 15th, 2024 at 3 PM'
      const result = await extract`Extract dates from: ${text}`.asType('date')

      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual(['2024-01-01', 'January 15th'])
    })

    it('should extract numbers when using asType("number")', async () => {
      const text = 'The price is $99.99 and we have 42 items in stock'
      const result = await extract`Extract numbers from: ${text}`.asType('number')

      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual(['42', '3.14', '$1,000'])
    })
  })

  describe('schema-based extraction', () => {
    it('should extract data according to provided schema', async () => {
      const description = 'iPhone 15 Pro costs $999 with features like ProRAW and Cinematic mode'
      const result = await extract`Extract product details from: ${description}`
        .withSchema({
          name: 'string',
          price: 'number',
          features: 'array'
        })

      expect(typeof result).toBe('object')
      expect(result).toHaveProperty('name', 'Test Product')
      expect(result).toHaveProperty('price', 99.99)
      expect(result).toHaveProperty('features')
      expect(Array.isArray(result.features)).toBe(true)
    })

    it('should support complex nested schemas', async () => {
      const text = 'Complex product information'
      const result = await extract`Extract from: ${text}`
        .withSchema({
          product: {
            name: 'string',
            specs: {
              cpu: 'string',
              ram: 'string'
            }
          },
          availability: 'in_stock|out_of_stock|pre_order'
        })

      expect(typeof result).toBe('object')
      expect(result).toHaveProperty('product')
    })
  })

  describe('method chaining', () => {
    it('should support chaining asType after withSchema', async () => {
      const text = 'Sample text'
      const result = await extract`Extract from: ${text}`
        .withSchema({ name: 'string' })
        .asType('object')

      expect(typeof result).toBe('object')
    })

    it('should support chaining withSchema after asType', async () => {
      const text = 'Sample text'
      const result = await extract`Extract from: ${text}`
        .asType('object')
        .withSchema({ name: 'string' })

      expect(typeof result).toBe('object')
    })
  })

  describe('error handling', () => {
    it('should throw error when not used as template literal', () => {
      expect(() => {
        extract('not a template literal')
      }).toThrow('extract function must be used as a template literal tag')
    })

    it('should support Promise methods', async () => {
      const result = extract`Extract from: test`

      expect(typeof result.then).toBe('function')
      expect(typeof result.catch).toBe('function')
      expect(typeof result.finally).toBe('function')
    })
  })
})
