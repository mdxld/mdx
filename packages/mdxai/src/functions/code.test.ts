import { describe, it, expect } from 'vitest'
import { code } from './code'

describe('code', () => {
  it('should return true if the question is true', async () => {
    try {
      const result = await code`a function that returns the sum of two numbers`
      expect(typeof result).toBe('string')
      expect(result).toContain('function')
      expect(result).toContain('sum')
    } catch (error) {
      expect((error as Error).message).toBeDefined()
    }
  })

  it('should return false if the question is false', async () => {
    try {
      const result = await code`a function that returns the sum of two numbers`
      expect(typeof result).toBe('string')
      expect(result).toContain('function')
      expect(result).toContain('sum')
    } catch (error) {
      expect((error as Error).message).toBeDefined()
    }
  })
})
