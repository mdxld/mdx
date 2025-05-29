import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { is } from './is'

describe('is', () => {

  it('should return a BooleanResult that behaves as true for true questions', async () => {
    const result = await is`2 + 2 = 4?`
    
    // Test boolean behavior in conditionals
    expect(!!result).toBe(true)
    expect(!result).toBe(false)
    if (result) {
      expect(true).toBe(true) // This should execute
    } else {
      expect(true).toBe(false) // This should not execute
    }
    
    // Test that it's actually an object with properties
    expect(typeof result).toBe('object')
    expect(result).toHaveProperty('answer')
    expect(result).toHaveProperty('thoughts')
    expect(result).toHaveProperty('confidence')
    
    // Test property values
    expect(result.answer).toBe(true)
    expect(Array.isArray(result.thoughts)).toBe(true)
    expect(typeof result.confidence).toBe('number')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(100)
  })

  it('should return a BooleanResult that behaves as false for false questions', async () => {
    const result = await is`TypeScript from Google?`
    
    // Test boolean behavior in conditionals
    expect(!!result).toBe(false)
    expect(!result).toBe(true)
    if (result) {
      expect(true).toBe(false) // This should not execute
    } else {
      expect(true).toBe(true) // This should execute
    }
    
    // Test that it's actually an object with properties
    expect(typeof result).toBe('object')
    expect(result).toHaveProperty('answer')
    expect(result).toHaveProperty('thoughts')
    expect(result).toHaveProperty('confidence')
    
    // Test property values
    expect(result.answer).toBe(false)
    expect(Array.isArray(result.thoughts)).toBe(true)
    expect(typeof result.confidence).toBe('number')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(100)
  })

  it('should work with valueOf() method', async () => {
    const trueResult = await is`JavaScript is a programming language?`
    const falseResult = await is`HTML is a programming language?`
    
    // Test valueOf() explicitly
    expect(trueResult.valueOf()).toBe(true)
    expect(falseResult.valueOf()).toBe(false)
    
    // Test that valueOf is called in boolean contexts
    expect(Number(trueResult)).toBe(1)  // true converts to 1
    expect(Number(falseResult)).toBe(0) // false converts to 0
  })

  it('should have proper toString() behavior', async () => {
    const result = await is`Python is a programming language?`
    
    const stringResult = result.toString()
    expect(typeof stringResult).toBe('string')
    expect(stringResult).toMatch(/^(true|false) \(confidence: \d+%\)$/)
    
    // Should include the answer and confidence
    if (result.answer) {
      expect(stringResult).toMatch(/^true \(confidence: \d+%\)$/)
    } else {
      expect(stringResult).toMatch(/^false \(confidence: \d+%\)$/)
    }
  })

  it('should have proper toJSON() behavior', async () => {
    const result = await is`CSS is a programming language?`
    
    const jsonResult = result.toJSON()
    expect(typeof jsonResult).toBe('object')
    expect(jsonResult).toHaveProperty('answer')
    expect(jsonResult).toHaveProperty('thoughts')
    expect(jsonResult).toHaveProperty('confidence')
    
    // Test JSON.stringify
    const stringified = JSON.stringify(result)
    const parsed = JSON.parse(stringified)
    expect(parsed).toHaveProperty('answer')
    expect(parsed).toHaveProperty('thoughts')
    expect(parsed).toHaveProperty('confidence')
    expect(typeof parsed.answer).toBe('boolean')
    expect(Array.isArray(parsed.thoughts)).toBe(true)
    expect(typeof parsed.confidence).toBe('number')
  })

  it('should work in various boolean contexts', async () => {
    const result = await is`Java is a programming language?`
    
    // Test in ternary operator
    const ternaryResult = result ? 'yes' : 'no'
    expect(ternaryResult).toBe(result.answer ? 'yes' : 'no')
    
    // Test in logical operations
    const andResult = result && 'truthy'
    const orResult = result || 'falsy'
    
    if (result.answer) {
      expect(andResult).toBe('truthy')
      expect(orResult).toBe(result) // Should return the result object itself
    } else {
      expect(andResult).toBe(result) // Should return the result object itself
      expect(orResult).toBe('falsy')
    }
    
    // Test with Boolean constructor
    expect(Boolean(result)).toBe(result.answer)
  })

  it('should handle template interpolation correctly', async () => {
    const language = 'Rust'
    const result = await is`${language} a programming language?`
    
    // Should work the same as direct usage
    expect(typeof result).toBe('object')
    expect(result).toHaveProperty('answer')
    expect(result).toHaveProperty('thoughts')
    expect(result).toHaveProperty('confidence')
    
    // The answer should likely be true for Rust
    expect(typeof result.answer).toBe('boolean')
  })

  it('should support a specified model', async () => {
    const result = await is`JavaScript is a programming language?`({ model: 'openai/gpt-4.1-nano' })
    expect(result).toBeDefined()
    expect(result.answer).toBe(true)
    expect(result.thoughts).toBeDefined()
    expect(result.confidence).toBeDefined()
  })
  
  it('should work as a simple function', async () => {
    const result = await is('JavaScript is a programming language?')
    expect(result).toBeDefined()
    expect(result.answer).toBe(true)
    expect(result.thoughts).toBeDefined()
    expect(result.confidence).toBeDefined()
  })

  it('should work as a simple function with a specified model', async () => {
    const result = await is('JavaScript is a programming language?', { model: 'openai/gpt-4.1-nano' })
    expect(result).toBeDefined()
    expect(result.answer).toBe(true)
    expect(result.thoughts).toBeDefined()
    expect(result.confidence).toBeDefined()
  })

})
