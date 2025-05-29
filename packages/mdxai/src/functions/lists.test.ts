import { describe, expect, it } from 'vitest'
import { list } from './list'
import { is } from './is'

describe('list', () => {
  it('should generate a list', async () => {
    const result = await list`10 programming languages`
    console.log(result)
    expect(result).toBeDefined()
    expect(result).toHaveLength(10)
    expect(await is`${result[0]} a programming language`).toBe(true)
    expect(await is`${result[5]} a programming language`).toBe(true)
  })
  it('should support async iterators', async () => {
    for await (const item of list`3 colors`) {
      console.log(item)
      expect(await is`${item} a color`).toBe(true)
    }
  })
})