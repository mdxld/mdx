import { describe, it, expect } from 'vitest'
import { is } from './is'

describe('is', () => {

  it('should return primitive boolean for simple template literal usage', async () => {
    const result = await is`2 + 2 = 4?`
    
    // Should be a primitive boolean
    expect(typeof result).toBe('boolean')
    expect(result).toBe(true)
    
    // Should work with all boolean matchers
    expect(result).toBeTruthy()
    if (result) {
      expect(true).toBe(true) // This should execute
    }
  })

  it('should return primitive boolean for false cases', async () => {
    const result = await is`TypeScript from Google?`
    
    // Should be a primitive boolean
    expect(typeof result).toBe('boolean')
    expect(result).toBe(false)
    
    // Should work with falsy matchers
    expect(result).toBeFalsy()
    if (!result) {
      expect(true).toBe(true) // This should execute
    }
  })

  it('should return enhanced object when called with empty options', async () => {
    const result = await is`JavaScript is a programming language?`()
    
    // Should be an object with debug info
    expect(typeof result).toBe('object')
    expect(result).toHaveProperty('answer')
    expect(result).toHaveProperty('thoughts')
    expect(result).toHaveProperty('confidence')
    
    // Test property values
    expect(typeof result.answer).toBe('boolean')
    expect(Array.isArray(result.thoughts)).toBe(true)
    expect(typeof result.confidence).toBe('number')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(100)
  })

  it('should support custom model options', async () => {
    const result = await is`Python is a programming language?`({ model: 'openai/gpt-4.1-nano' })
    
    // Should return enhanced object with debug info
    expect(typeof result).toBe('object')
    expect(result).toHaveProperty('answer')
    expect(result).toHaveProperty('thoughts')
    expect(result).toHaveProperty('confidence')
    expect(result.answer).toBe(true)
  })

  it('should work as normal function returning boolean by default', async () => {
    const result = await is('Java is a programming language?')
    
    // Should be a primitive boolean
    expect(typeof result).toBe('boolean')
    expect(result).toBe(true)
  })

  it('should return enhanced object when normal function called with options', async () => {
    const result = await is('C++ is a programming language?', { model: 'openai/gpt-4.1-nano' }) as any
    
    // Should be an object with debug info
    expect(typeof result).toBe('object')
    expect(result).toHaveProperty('answer')
    expect(result).toHaveProperty('thoughts')
    expect(result).toHaveProperty('confidence')
    expect(result.answer).toBe(true)
  })

  it('should handle template interpolation correctly', async () => {
    const language = 'Rust'
    const result = await is`${language} a programming language?`
    
    // Should work the same as direct usage
    expect(typeof result).toBe('boolean')
    expect(result).toBe(true)
  })

  it('should handle template interpolation with options', async () => {
    const language = 'Go'
    const result = await is`${language} a programming language?`({ temperature: 0.1 })
    
    // Should return enhanced object
    expect(typeof result).toBe('object')
    expect(result.answer).toBe(true)
    expect(Array.isArray(result.thoughts)).toBe(true)
  })

})
