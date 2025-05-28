import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { say } from './aiHandler'

describe('say template function', () => {
  const originalEnv = { ...process.env }
  
  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    process.env.USE_CACHE = 'true'
  })
  
  afterEach(() => {
    process.env = { ...originalEnv }
  })
  
  it('should work as a template literal function', async () => {
    try {
      const result = await say`Hello world`
      
      expect(typeof result).toBe('string')
      expect(result.endsWith('.wav')).toBe(true)
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests/i)
      } else {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests|Bad Request/i)
      }
    }
  }, 60000) // Increase timeout for real API calls
  
  it('should handle variable interpolation', async () => {
    try {
      const text = 'Hello world'
      const result = await say`${text}`
      
      expect(typeof result).toBe('string')
      expect(result.endsWith('.wav')).toBe(true)
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests/i)
      } else {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests|Bad Request/i)
      }
    }
  }, 60000) // Increase timeout for real API calls
  
  it('should throw error when not used as template literal', () => {
    const incorrectUsage = new Function('say', 'return say("not a template literal")')
    
    expect(() => {
      incorrectUsage(say)
    }).toThrow('Say function must be called as a template literal')
  })
  
  it('should handle complex objects in template literals', async () => {
    try {
      const complexContext = {
        greeting: 'Hello',
        target: 'world',
      }
      
      const result = await say`Say ${complexContext}`
      
      expect(typeof result).toBe('string')
      expect(result.endsWith('.wav')).toBe(true)
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests/i)
      } else {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests|Bad Request/i)
      }
    }
  }, 60000) // Increase timeout for real API calls
})
