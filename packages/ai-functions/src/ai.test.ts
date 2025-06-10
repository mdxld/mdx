import { describe, it, expect } from 'vitest'
import { createAIModel } from './ai.js'

describe('ai module', () => {
  it('should export createAIModel function', () => {
    expect(typeof createAIModel).toBe('function')
  })

  it('should create AI model instance', () => {
    const model = createAIModel()
    expect(model).toBeDefined()
  })

  it('should handle configuration options', () => {
    const model = createAIModel('test-api-key', 'https://api.example.com')
    expect(model).toBeDefined()
  })
})
