import { describe, expect, it } from 'vitest'
import { list } from 'mdxai'

describe('list', () => {
  it('should be defined', () => {
    expect(list).toBeDefined()
  })
  it('should return an array', async () => {
    const result = await list`5 blog post titles about AGI`
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(5)
  })
  it('should interpolate variables', async () => {
    const name = 'AGI'
    const result = await list`5 blog post titles about ${name}`
    expect(result.length).toBe(5)
  })
  it('should be async iterable', async () => {
    let count = 0
    for await (const item of list`5 blog post titles about AGI`) {
      expect(item).toBeTypeOf('string')
      count++
    }
    expect(count).toBe(5)
  })
})