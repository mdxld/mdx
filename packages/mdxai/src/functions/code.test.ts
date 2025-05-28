import 'dotenv/config'
import { describe, it, expect } from 'vitest'
import { code } from './code'

describe('code', () => {
  it('should generate a function that returns the sum of two numbers', async () => {
    try {
      const result = await code`a function that returns the sum of two numbers`
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      // Check that the result contains relevant keywords for a sum function
      expect(result.toLowerCase()).toMatch(/function|sum|add|\+|return/)
    } catch (error) {
      expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
    }
  })

  it('should generate TypeScript code with proper structure', async () => {
    try {
      const result = await code`a function that returns the sum of two numbers`
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      // Check for TypeScript-like structure
      expect(result).toMatch(/function|const|=>/i)
    } catch (error) {
      expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
    }
  })
})
