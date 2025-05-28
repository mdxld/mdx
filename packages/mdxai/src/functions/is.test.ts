import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { is } from './is'
import * as aiModule from 'ai'

vi.mock('ai', () => {
  return {
    generateObject: vi.fn().mockImplementation(({ prompt }) => {
      const isTrue = prompt.includes('2 + 2 = 4')
      return Promise.resolve({
        object: {
          answer: isTrue
        }
      })
    }),
    model: vi.fn().mockReturnValue('mock-model')
  }
})

describe('is', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return true if the question is true', async () => {
    const result = await is`2 + 2 = 4?`
    expect(result).toBe(true)
  })

  it('should return false if the question is false', async () => {
    const result = await is`TypeScript from Google?`
    expect(result).toBe(false)
  })
})
