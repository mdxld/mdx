import { describe, it, expect } from 'vitest'
import { parseTemplate, stringifyValue } from './utils/template.js'
import { createAIModel } from './ai.js'

describe('ai-functions', () => {
  it('should export parseTemplate utility', () => {
    expect(typeof parseTemplate).toBe('function')
  })

  it('should export stringifyValue utility', () => {
    expect(typeof stringifyValue).toBe('function')
  })

  it('should export createAIModel function', () => {
    expect(typeof createAIModel).toBe('function')
  })

  it('should parse template strings correctly', () => {
    const template = Object.assign(['Hello ', ' world'], {
      raw: ['Hello ', ' world'],
      forEach: Array.prototype.forEach
    }) as TemplateStringsArray
    const result = parseTemplate(template, ['beautiful'])
    expect(result).toBe('Hello beautiful world')
  })

  it('should stringify values correctly', () => {
    expect(stringifyValue('test')).toBe('test')
    expect(stringifyValue(123)).toBe('123')
    expect(stringifyValue({ key: 'value' })).toBe('key: value')
  })
})
