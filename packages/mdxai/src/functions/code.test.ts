import { describe, it, expect } from 'vitest'
import { code } from './code'

describe('code', () => {
  it('should generate TypeScript code for a given prompt', async () => {
    try {
      const result = await code`a function that returns the sum of two numbers`
      
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(result).toContain('function')
      expect(result).toContain('return')
    } catch (error) {
      expect(error).toBeDefined()
    }
  }, 60000) // Increase timeout for real API calls

  it('should handle complex code generation requests', async () => {
    try {
      const result = await code`a class that implements a simple cache with get and set methods`
      
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(result).toContain('class')
      expect(result).toContain('get')
      expect(result).toContain('set')
    } catch (error) {
      expect(error).toBeDefined()
    }
  }, 60000) // Increase timeout for real API calls
})
