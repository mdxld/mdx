import { describe, expect, it } from 'vitest'
import { list } from 'mdxai'

const isCI = process.env.CI === 'true'
const hasApiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_TOKEN

describe.skipIf(isCI || !hasApiKey)('list', () => {
  it('should be defined', () => {
    expect(list).toBeDefined()
  })
  it('should return an array', async () => {
    const result = await list`5 blog post titles about AGI`
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })
  it('should interpolate variables', async () => {
    const name = 'AGI'
    const result = await list`5 blog post titles about ${name}`
    expect(result.length).toBeGreaterThan(0)
  })
  it('should be async iterable', async () => {
    const uniqueId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    
    const items = await list`5 blog post titles about ${uniqueId}`
    expect(items.length).toBeGreaterThan(0)
    
    const iteratedItems = []
    let count = 0
    
    for await (const item of list`5 blog post titles about ${uniqueId}`) {
      iteratedItems.push(item)
      count++
      
      if (count >= 3) break // Limit to 3 items to match actual API behavior
    }
    
    expect(iteratedItems.length).toBeGreaterThan(0)
    expect(count).toBeGreaterThan(0)
    
    iteratedItems.forEach(item => {
      expect(item).toBeTypeOf('string')
    })
  })
})
