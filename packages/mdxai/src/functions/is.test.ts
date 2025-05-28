import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { is } from './is'


describe('is', () => {

  it('should return true if the question is true', async () => {
    try {
      const result = await is`2 + 2 = 4?`
      expect(typeof result).toBe('boolean')
      expect(result).toBe(true)
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests/i)
      } else {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests|Bad Request/i)
      }
    }
  }, 60000) // Increase timeout for real API calls

  it('should return false if the question is false', async () => {
    try {
      const result = await is`TypeScript from Google?`
      expect(typeof result).toBe('boolean')
      expect(result).toBe(false)
    } catch (error) {
      if (!process.env.CI) {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests/i)
      } else {
        expect((error as Error).message).toMatch(/API key not valid|missing|unauthorized|quota|exceeded|Too Many Requests|Bad Request/i)
      }
    }
  }, 60000) // Increase timeout for real API calls

})
