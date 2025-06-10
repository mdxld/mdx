import 'dotenv/config'
import { describe, expect, it } from 'vitest'
import { ai } from 'mdxai'

describe('ai', () => {
  it('should be defined', () => {
    expect(ai).toBeDefined()
  })

  describe('template literal syntax', () => {
    it('should work with basic template literal', async () => {
      const result = await ai`how many r's are there in the word strawberry?`
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle variable interpolation in template literals', async () => {
      const word = 'strawberry'
      const result = await ai`how many r's are there in the word ${word}?`
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle complex variable interpolation', async () => {
      const topic = 'artificial intelligence'
      const count = 3
      const result = await ai`Write ${count} key points about ${topic}`
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    }, 10000)

    it('should handle object interpolation in template literals', async () => {
      const config = { name: 'Test API', version: '1.0' }
      const result = await ai`Describe this API configuration: ${config}`
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    }, 10000)
  })

  describe('dynamic property access', () => {
    it('should work with leanCanvas function using object parameter', async () => {
      const result = await ai.leanCanvas({ brand: 'vercel.com' })
      expect(result).toBeDefined()
      
      if (typeof result === 'object') {
        expect(result).toHaveProperty('problem')
        expect(result).toHaveProperty('solution')
      } else {
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
        expect(result.toLowerCase()).toContain('vercel')
      }
    }, 10000)

    it('should work with leanCanvas function using string parameter', async () => {
      const result = await ai.leanCanvas('Create a lean canvas for a SaaS productivity tool')
      expect(result).toBeDefined()
      
      if (typeof result === 'object') {
        expect(result).toHaveProperty('problem')
        expect(result).toHaveProperty('solution')
      } else {
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      }
    }, 10000)

    it('should work with leanCanvas function using template literal', async () => {
      const brand = 'vercel.com'
      const result = await ai.leanCanvas`Create a lean canvas for ${brand}`
      expect(result).toBeDefined()
      
      if (typeof result === 'object') {
        expect(result).toHaveProperty('problem')
        expect(result).toHaveProperty('solution')
      } else {
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      }
    }, 10000)

    it('should handle dynamic function names', async () => {
      const functionName = 'leanCanvas'
      const result = await ai[functionName]({ brand: 'example.com' })
      expect(result).toBeDefined()
      
      if (typeof result === 'object') {
        expect(result).toHaveProperty('problem')
        expect(result).toHaveProperty('solution')
      } else {
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      }
    }, 10000)
  })

  describe('error handling', () => {
    it('should throw error for invalid template literal usage', async () => {
      await expect(async () => {
        await (ai as any)()
      }).rejects.toThrow()
    })

    it('should handle non-existent function gracefully', async () => {
      const result = await ai.nonExistentFunction('test prompt')
      expect(typeof result).toBe('string')
    })
  })

  describe('type validation', () => {
    it('should return string for basic ai calls', async () => {
      const result = await ai`hello world`
      expect(typeof result).toBe('string')
    })

    it('should return appropriate content for leanCanvas', async () => {
      const result = await ai.leanCanvas({ brand: 'test' })
      expect(result).toBeDefined()
      
      if (typeof result === 'object') {
        expect(result).toHaveProperty('problem')
        expect(result).toHaveProperty('solution')
        expect(Object.keys(result).length).toBeGreaterThan(0)
      } else {
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      }
    }, 10000)
  })
})
