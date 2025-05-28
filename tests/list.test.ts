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
    const uniqueId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    
    const items = await list`5 blog post titles about ${uniqueId}`
    expect(items.length).toBe(5)
    
    const iteratedItems = []
    let count = 0
    
    for await (const item of list`5 blog post titles about ${uniqueId}`) {
      iteratedItems.push(item)
      count++
      
      if (count >= 5) break
    }
    
    expect(iteratedItems.length).toBe(5)
    expect(count).toBe(5)
    
    iteratedItems.forEach(item => {
      expect(item).toBeTypeOf('string')
    })
  })
})
