import { describe, it, expect } from 'vitest'
import { stringifyValue, parseTemplate } from './template'

describe('template utilities', () => {
  describe('stringifyValue', () => {
    it('should stringify strings as-is', () => {
      expect(stringifyValue('hello')).toBe('hello')
    })

    it('should stringify numbers as strings', () => {
      expect(stringifyValue(42)).toBe('42')
    })

    it('should stringify objects as YAML', () => {
      const obj = { name: 'John', age: 30 }
      const result = stringifyValue(obj)
      expect(result).toContain('name: John')
      expect(result).toContain('age: 30')
    })

    it('should stringify arrays as YAML', () => {
      const arr = ['apple', 'banana', 'cherry']
      const result = stringifyValue(arr)
      expect(result).toContain('- apple')
      expect(result).toContain('- banana')
      expect(result).toContain('- cherry')
    })

    it('should handle null values', () => {
      expect(stringifyValue(null)).toBe('null')
    })
  })

  describe('parseTemplate', () => {
    it('should parse simple template literals', () => {
      const template = ['Hello ', ' world!'] as any as TemplateStringsArray
      const values = ['beautiful']
      const result = parseTemplate(template, values)
      expect(result).toBe('Hello beautiful world!')
    })

    it('should handle object interpolation with YAML', () => {
      const template = ['User: ', ''] as any as TemplateStringsArray
      const values = [{ name: 'John', age: 30 }]
      const result = parseTemplate(template, values)
      expect(result).toContain('User: name: John')
      expect(result).toContain('age: 30')
    })

    it('should handle array interpolation with YAML', () => {
      const template = ['Items: ', ''] as any as TemplateStringsArray
      const values = [['apple', 'banana']]
      const result = parseTemplate(template, values)
      expect(result).toContain('Items: - apple')
      expect(result).toContain('- banana')
    })

    it('should handle multiple interpolations', () => {
      const template = ['Name: ', ', Age: ', ', Items: ', ''] as any as TemplateStringsArray
      const values = ['John', 30, ['apple', 'banana']]
      const result = parseTemplate(template, values)
      expect(result).toContain('Name: John')
      expect(result).toContain('Age: 30')
      expect(result).toContain('Items: - apple')
    })
  })
}) 