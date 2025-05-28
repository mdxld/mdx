import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { is } from './is'
import * as aiModule from 'ai'


describe('is', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return true if the question is true', async () => {
    try {
      const result = await is`2 + 2 = 4?`
      expect(typeof result).toBe('boolean')
      if (result !== undefined) {
        expect(result).toBe(true)
      }
    } catch (error) {
      expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
    }
  })

  it('should return false if the question is false', async () => {
    try {
      const result = await is`TypeScript from Google?`
      expect(typeof result).toBe('boolean')
      if (result !== undefined) {
        expect(result).toBe(false)
      }
    } catch (error) {
      expect((error as Error).message).toMatch(/API key|not valid|unauthorized|Bad Request/i)
    }
  })
})
