import { describe, expect, it } from 'vitest'
import { list } from './list'
import { is } from './is'

describe('list', () => {
  it('should generate a list with tagged template literal', async () => {
    const result = await list`10 programming languages`
    console.log(result)
    expect(result).toBeDefined()
    expect(result).toHaveLength(10)
    expect(await is`${result[0]} a programming language`).toBe(true)
    expect(await is`${result[5]} a programming language`).toBe(true)
  })
  it('should support async iterators with tagged template literal', async () => {
    for await (const item of list`3 colors`) {
      console.log(item)
      expect(await is`${item} a color`).toBe(true)
    }
  })
  it('should generate a list with tagged template literal and a specified model', async () => {
    const result = await list`10 programming languages`({ model: 'openai/gpt-4.1-nano' })
    console.log(result)
    expect(result).toBeDefined()
    expect(result).toHaveLength(10)
    expect(await is`${result[0]} a programming language`).toBe(true)
    expect(await is`${result[5]} a programming language`).toBe(true)
  })
  it('should support async iterators with tagged template literal and a specified model', async () => {
    for await (const item of list`3 colors`({ model: 'openai/gpt-4.1-nano' })) {
      console.log(item)
      expect(await is`${item} a color`).toBe(true)
    }
  })
  it('should generate a list as a simple function', async () => {
    const result = await list('10 programming languages')
    console.log(result)
    expect(result).toBeDefined()
    expect(result).toHaveLength(10)
    expect(await is`${result[0]} a programming language`).toBe(true)
    expect(await is`${result[5]} a programming language`).toBe(true)
  })
  it('should generate a list as a simple function with a specified model', async () => {
    const result = await list('10 programming languages', { model: 'openai/gpt-4.1-nano' })
    console.log(result)
    expect(result).toBeDefined()
    expect(result).toHaveLength(10)
    expect(await is`${result[0]} a programming language`).toBe(true)
    expect(await is`${result[5]} a programming language`).toBe(true)
  })
  it('should support async iterators with a simple function', async () => {
    for await (const item of list('3 colors')) {
      console.log(item)
      expect(await is`${item} a color`).toBe(true)
    }
  })
  it('should support async iterators with a simple function and a specified model', async () => {
    for await (const item of list('3 colors', { model: 'openai/gpt-4.1-nano' })) {
      console.log(item)
      expect(await is`${item} a color`).toBe(true)
    }
  })
})