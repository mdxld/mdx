import { describe, it, expect } from 'vitest'
import { is } from './is'

describe('is', () => {
  it('should return true if the question is true', async () => {
    const result = await is`2 + 2 = 4?`
    expect(result).toBe(true)
  })

  it('should return false if the question is false', async () => {
    const result = await is`TypeScript from Google?`
    expect(result).toBe(false)
  })
})