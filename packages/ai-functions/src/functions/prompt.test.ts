import 'dotenv/config'
import { describe, it, expect } from 'vitest'
import { prompt } from './prompt.js'

describe('prompt', () => {
  it('should be callable as a template literal', async () => {
    const result = await prompt`Create a system prompt for a helpful assistant`
    expect(result).toBeDefined()
    expect(typeof result.text).toBe('string')
    expect(result.type).toBe('user')
    expect(result.metadata.model).toContain('claude-opus-4')
  })

  it('should generate system prompts when specified', async () => {
    const result = await prompt('Create a system prompt for a coding assistant', { 
      type: 'system',
      role: 'Senior Software Engineer'
    })
    expect(result.type).toBe('system')
    expect(result.metadata.role).toBe('Senior Software Engineer')
  })

  it('should generate prompt templates when specified', async () => {
    const result = await prompt('Create a template for code review comments', { 
      type: 'template',
      format: 'template'
    })
    expect(result.type).toBe('template')
    expect(result.metadata.format).toBe('template')
  })

  it('should handle examples and constraints', async () => {
    const result = await prompt('Create a user prompt for creative writing', {
      type: 'user',
      examples: [
        { input: 'Write a story', output: 'Once upon a time...' }
      ],
      constraints: ['Keep it under 500 words', 'Use simple language']
    })
    expect(result.type).toBe('user')
    expect(result.text).toBeDefined()
  })

  it('should use custom model when specified', async () => {
    const result = await prompt('Test prompt', {
      model: 'google/gemini-2.5-flash-preview-05-20'
    })
    expect(result.metadata.model).toBe('google/gemini-2.5-flash-preview-05-20')
  })
})
