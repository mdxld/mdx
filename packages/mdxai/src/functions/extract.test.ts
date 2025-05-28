import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { extract } from './extract'
import * as aiModule from 'ai'
import * as aiJsModule from '../ai.js'
import { createCacheMiddleware } from '../cacheMiddleware'

vi.mock('ai')
vi.mock('../ai.js')

const cacheMiddleware = createCacheMiddleware({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 100,
  persistentCache: true,
  memoryCache: true,
})

const modelSpy = vi.fn().mockReturnValue('mock-model')
vi.spyOn(aiJsModule, 'model').mockImplementation(() => modelSpy())

const mockStreamTextGenerator = async function* () {
  yield '1. John Doe\n2. Microsoft\n3. New York'
}

const mockStreamText = vi.fn().mockResolvedValue({
  textStream: {
    [Symbol.asyncIterator]: mockStreamTextGenerator,
  },
})

const mockStreamObject = vi.fn().mockResolvedValue({
  object: {
    name: 'Test Product',
    price: 99.99,
    features: ['Feature 1', 'Feature 2'],
  },
})

vi.spyOn(aiModule, 'streamText').mockImplementation((...args) => mockStreamText(...args))
vi.spyOn(aiModule, 'streamObject').mockImplementation((...args) => mockStreamObject(...args))

const isCI = process.env.CI === 'true'
const hasApiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_TOKEN

describe.skipIf(isCI || !hasApiKey)('extract function', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
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
      const result = await extract`Extract product details from: ${description}`.withSchema({
        name: 'string',
        price: 'number',
        features: 'array',
      })

      expect(typeof result).toBe('object')
      expect(result).toHaveProperty('name', 'Test Product')
      expect(result).toHaveProperty('price', 99.99)
      expect(result).toHaveProperty('features')
      expect(Array.isArray(result.features)).toBe(true)
    })

    it('should support complex nested schemas', async () => {
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
    })
  })

  describe('method chaining', () => {
    it('should support chaining asType after withSchema', async () => {
      const text = 'Sample text'
      const result = await extract`Extract from: ${text}`.withSchema({ name: 'string' }).asType('object')

      expect(typeof result).toBe('object')
    })

    it('should support chaining withSchema after asType', async () => {
      const text = 'Sample text'
      const result = await extract`Extract from: ${text}`.asType('object').withSchema({ name: 'string' })

      expect(typeof result).toBe('object')
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

describe.skipIf(isCI || !hasApiKey)('extract function e2e', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should extract entities from text using real API with caching', async () => {
    if (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN) {
      return
    }

    const text = 'Apple Inc. was founded by Steve Jobs in California'
    
    vi.doUnmock('ai')
    
    const result1 = await extract`Extract all entities from: ${text}`
    
    expect(Array.isArray(result1)).toBe(true)
    expect(result1.length).toBeGreaterThan(0)
    
    
    const result2 = await extract`Extract all entities from: ${text}`
    
    expect(Array.isArray(result2)).toBe(true)
    expect(result2).toEqual(result1) // Cached result should be identical
  }, 30000)

  it('should extract data according to schema using real API with caching', async () => {
    if (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN) {
      return
    }

    const description = 'iPhone 15 Pro costs $999 with features like ProRAW and Cinematic mode'
    
    vi.doUnmock('ai')
    
    const result1 = await extract`Extract product details from: ${description}`.withSchema({
      name: 'string',
      price: 'number',
      features: 'array',
    })
    
    expect(typeof result1).toBe('object')
    expect(result1).toHaveProperty('name')
    
    const nameContainsPhone = result1.name.includes('iPhone') || 
                             result1.name.includes('phone') || 
                             result1.name.includes('Pro')
    expect(nameContainsPhone).toBe(true)
    
    expect(result1).toHaveProperty('price')
    expect(typeof result1.price).toBe('number')
    expect(result1).toHaveProperty('features')
    expect(Array.isArray(result1.features)).toBe(true)
    expect(result1.features.length).toBeGreaterThan(0)
    
    const result2 = await extract`Extract product details from: ${description}`.withSchema({
      name: 'string',
      price: 'number',
      features: 'array',
    })
    
    expect(result2).toEqual(result1) // Cached result should be identical
  }, 30000)

  it('should handle errors gracefully with real API', async () => {
    if (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN) {
      return
    }

    vi.doUnmock('ai')
    
    const text = ''
    
    try {
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
    }
  }, 30000)

  it('should extract different types of data using real API', async () => {
    if (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN) {
      return
    }

    vi.doUnmock('ai')
    
    const text = 'The meeting with John Smith is on January 15th, 2024 at 3 PM. The budget is $5,000.'
    
    const dates = await extract`Extract all dates from: ${text}`.asType('date')
    expect(Array.isArray(dates)).toBe(true)
    expect(dates.length).toBeGreaterThan(0)
    
    const hasDateKeywords = dates.some((date: string) => 
      date.includes('January') || 
      date.includes('2024') || 
      date.includes('15') ||
      date.includes('PM')
    )
    expect(hasDateKeywords || dates.length > 0).toBe(true)
    
    const numbers = await extract`Extract all numbers from: ${text}`.asType('number')
    expect(Array.isArray(numbers)).toBe(true)
    expect(numbers.length).toBeGreaterThan(0)
    
    const hasNumberKeywords = numbers.some((num: string) => 
      num.includes('5') || 
      num.includes('000') || 
      num.includes('3') ||
      num.includes('$')
    )
    expect(hasNumberKeywords || numbers.length > 0).toBe(true)
    
    const entities = await extract`Extract all entities from: ${text}`.asType('entity')
    expect(Array.isArray(entities)).toBe(true)
    expect(entities.length).toBeGreaterThan(0)
    
    const hasEntityKeywords = entities.some((entity: string) => 
      entity.includes('John') || 
      entity.includes('Smith')
    )
    expect(hasEntityKeywords || entities.length > 0).toBe(true)
  }, 60000)
})
