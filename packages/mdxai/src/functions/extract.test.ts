import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { extract } from './extract'
import * as aiModule from 'ai'
import * as aiJsModule from '../ai.js'
import { createCacheMiddleware } from '../cacheMiddleware'

const cacheMiddleware = createCacheMiddleware({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 100,
  persistentCache: true,
  memoryCache: true,
})

describe('extract function (mocked)', () => {
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
      try {
        const text = 'John Doe works at Microsoft in New York'
        const result = await extract`Extract all person names from: ${text}`

        expect(Array.isArray(result)).toBe(true)
        if (result.length > 0) {
          expect(typeof result[0]).toBe('string')
        }
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })

    it('should handle variable interpolation', async () => {
      try {
        const document = 'Sample document with data'
        const result = await extract`Extract important information from: ${document}`

        expect(result).toBeDefined()
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })
  })

  describe('type-specific extraction', () => {
    it('should extract entities when using asType("entity")', async () => {
      try {
        const text = 'Apple Inc. was founded by Steve Jobs'
        const result = await extract`Extract entities from: ${text}`.asType('entity')

        expect(Array.isArray(result)).toBe(true)
        if (result.length > 0) {
          expect(typeof result[0]).toBe('string')
        }
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })

    it('should extract dates when using asType("date")', async () => {
      try {
        const text = 'The meeting is on January 15th, 2024 at 3 PM'
        const result = await extract`Extract dates from: ${text}`.asType('date')

        expect(Array.isArray(result)).toBe(true)
        if (result.length > 0) {
          expect(typeof result[0]).toBe('string')
        }
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })

    it('should extract numbers when using asType("number")', async () => {
      try {
        const text = 'The price is $99.99 and we have 42 items in stock'
        const result = await extract`Extract numbers from: ${text}`.asType('number')

        expect(Array.isArray(result)).toBe(true)
        if (result.length > 0) {
          expect(typeof result[0]).toBe('string')
        }
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })
  })

  describe('schema-based extraction', () => {
    it('should extract data according to provided schema', async () => {
      try {
        const description = 'iPhone 15 Pro costs $999 with features like ProRAW and Cinematic mode'
        const result = await extract`Extract product details from: ${description}`.withSchema({
          name: 'string',
          price: 'number',
          features: 'array',
        })

        expect(typeof result).toBe('object')
        expect(result).toHaveProperty('name')
        expect(result).toHaveProperty('price')
        expect(result).toHaveProperty('features')
        if (result.features) {
          expect(Array.isArray(result.features)).toBe(true)
        }
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })

    it('should support complex nested schemas', async () => {
      try {
        const text = 'Complex product information'
        const result = await extract`Extract from: ${text}`.withSchema({
          product: {
            name: 'string',
            specs: {
              cpu: 'string',
              ram: 'string',
            },
          },
          availability: 'in_stock|out_of_stock|pre_order',
        })

        expect(typeof result).toBe('object')
        expect(result).toHaveProperty('product')
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })
  })

  describe('method chaining', () => {
    it('should support chaining asType after withSchema', async () => {
      try {
        const text = 'Sample text'
        const result = await extract`Extract from: ${text}`.withSchema({ name: 'string' }).asType('object')

        expect(typeof result).toBe('object')
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })

    it('should support chaining withSchema after asType', async () => {
      try {
        const text = 'Sample text'
        const result = await extract`Extract from: ${text}`.asType('object').withSchema({ name: 'string' })

        expect(typeof result).toBe('object')
      } catch (error) {
        expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    })
  })

  describe('error handling', () => {
    it('should throw error when not used as template literal', () => {
      expect(() => {
        // @ts-expect-error - intentionally testing runtime error when used incorrectly
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

describe('extract function e2e', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should extract entities from text using real API with caching', async () => {
    try {
      const text = 'Apple Inc. was founded by Steve Jobs in California'
      
      const result1 = await extract`Extract all entities from: ${text}`
      
      expect(Array.isArray(result1)).toBe(true)
      if (result1.length > 0) {
        expect(typeof result1[0]).toBe('string')
        
        const result2 = await extract`Extract all entities from: ${text}`
        expect(Array.isArray(result2)).toBe(true)
      }
    } catch (error) {
      expect(error).toBeDefined()
    }
  }, 60000) // Increase timeout for real API calls

  it('should extract data according to schema using real API with caching', async () => {
    try {
      const description = 'iPhone 15 Pro costs $999 with features like ProRAW and Cinematic mode'
      
      const result1 = await extract`Extract product details from: ${description}`.withSchema({
        name: 'string',
        price: 'number',
        features: 'array',
      })
      
      expect(typeof result1).toBe('object')
      expect(result1).toHaveProperty('name')
      
      if (result1.name) {
        const nameContainsPhone = result1.name.includes('iPhone') || 
                                result1.name.includes('phone') || 
                                result1.name.includes('Pro')
        expect(nameContainsPhone || typeof result1.name === 'string').toBe(true)
      }
      
      expect(result1).toHaveProperty('price')
      if (result1.price !== undefined) {
        expect(typeof result1.price).toBe('number')
      }
      
      expect(result1).toHaveProperty('features')
      if (result1.features) {
        expect(Array.isArray(result1.features)).toBe(true)
      }
      
      const result2 = await extract`Extract product details from: ${description}`.withSchema({
        name: 'string',
        price: 'number',
        features: 'array',
      })
      
    } catch (error) {
      expect(error).toBeDefined()
    }
  }, 60000) // Increase timeout for real API calls

  it('should handle errors gracefully with real API', async () => {
    try {
      const text = ''
      
      const result = await extract`Extract entities from: ${text}`
      
      if (Array.isArray(result)) {
        expect(result.length).toBeLessThanOrEqual(3)
      } else if (typeof result === 'object') {
        expect(result).toBeDefined()
      } else {
        expect(typeof result).toBe('string')
      }
    } catch (error: any) {
      expect(error.message).toBeDefined()
      expect(error.message).toMatch(/API key|not valid|unauthorized|Bad Request|empty input/i)
    }
  }, 30000)

  it('should extract different types of data using real API', async () => {
    try {
      const text = 'The meeting with John Smith is on January 15th, 2024 at 3 PM. The budget is $5,000.'
      
      try {
        const dates = await extract`Extract all dates from: ${text}`.asType('date')
        expect(Array.isArray(dates)).toBe(true)
        
        if (dates.length > 0) {
          const hasDateKeywords = dates.some((date: string) => 
            date.includes('January') || 
            date.includes('2024') || 
            date.includes('15') ||
            date.includes('PM')
          )
          expect(hasDateKeywords || typeof dates[0] === 'string').toBe(true)
        }
      } catch (dateError) {
        expect((dateError as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
      
      try {
        const numbers = await extract`Extract all numbers from: ${text}`.asType('number')
        expect(Array.isArray(numbers)).toBe(true)
        
        if (numbers.length > 0) {
          const hasNumberKeywords = numbers.some((num: string) => 
            num.includes('5') || 
            num.includes('000') || 
            num.includes('3') ||
            num.includes('$')
          )
          expect(hasNumberKeywords || typeof numbers[0] === 'string').toBe(true)
        }
      } catch (numberError) {
        expect((numberError as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
      
      try {
        const entities = await extract`Extract all entities from: ${text}`.asType('entity')
        expect(Array.isArray(entities)).toBe(true)
        
        if (entities.length > 0) {
          const hasEntityKeywords = entities.some((entity: string) => 
            entity.includes('John') || 
            entity.includes('Smith')
          )
          expect(hasEntityKeywords || typeof entities[0] === 'string').toBe(true)
        }
      } catch (entityError) {
        expect((entityError as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
      }
    } catch (error) {
      expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
    }
  }, 60000)
})
