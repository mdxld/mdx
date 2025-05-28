import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { say } from './aiHandler'

describe('say template function', () => {
  const originalEnv = { ...process.env }
  
  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    process.env.GEMINI_API_KEY = 'test-api-key'
    process.env.USE_CACHE = 'true'
  })
  
  afterEach(() => {
    process.env = { ...originalEnv }
  })
  
  it('should work as a template literal function', async () => {
    if (process.env.CI === 'true' || (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN)) {
      return
    }
    
    const result = await say`Hello world`
    
    expect(typeof result).toBe('string')
    expect(result.endsWith('.wav')).toBe(true)
  }, 60000) // Increase timeout for real API calls
  
  it('should handle variable interpolation', async () => {
    if (process.env.CI === 'true' || (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN)) {
      return
    }
    
    const text = 'Hello world'
    const result = await say`${text}`
    
    expect(typeof result).toBe('string')
    expect(result.endsWith('.wav')).toBe(true)
  }, 60000) // Increase timeout for real API calls
  
  it('should throw error when not used as template literal', () => {
    const incorrectUsage = new Function('say', 'return say("not a template literal")')
    
    expect(() => {
      incorrectUsage(say)
    }).toThrow('Say function must be called as a template literal')
  })
  
  it('should handle complex objects in template literals', async () => {
    if (process.env.CI === 'true' || (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_TOKEN)) {
      return
    }
    
    const complexContext = {
      greeting: 'Hello',
      target: 'world',
    }
    
    const result = await say`Say ${complexContext}`
    
    expect(typeof result).toBe('string')
    expect(result.endsWith('.wav')).toBe(true)
  }, 60000) // Increase timeout for real API calls
})
