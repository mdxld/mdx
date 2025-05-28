import { describe, it, expect, vi } from 'vitest'
import { stringifyValue, parseTemplate, createUnifiedFunction } from './template'

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
  
  describe('createUnifiedFunction', () => {
    it('should handle tagged template literals (Pattern 1)', () => {
      const mockCallback = vi.fn().mockReturnValue('result')
      const testFunction = createUnifiedFunction(mockCallback)
      
      const result = testFunction`Hello ${'world'}`
      
      expect(mockCallback).toHaveBeenCalledWith('Hello world', {})
      expect(result).toBe('result')
    })
    
    it('should handle curried tagged template with options (Pattern 2)', () => {
      const mockCallback = vi.fn().mockReturnValue('result')
      const testFunction = createUnifiedFunction(mockCallback)
      
      // @ts-expect-error - Accessing a property that doesn't exist on Function
      const result = testFunction.customProp`Hello ${'world'}`({ model: 'test-model' })
      
      expect(mockCallback).toHaveBeenCalledWith('Hello world', { model: 'test-model' })
      expect(result).toBe('result')
    })
    
    it('should handle normal function calls (Pattern 3)', () => {
      const mockCallback = vi.fn().mockReturnValue('result')
      const testFunction = createUnifiedFunction(mockCallback)
      
      const options = { model: 'test-model' }
      const result = testFunction('Hello world', options)
      
      expect(mockCallback).toHaveBeenCalledWith('Hello world', options)
      expect(result).toBe('result')
    })
    
    it('should throw error for invalid call patterns', () => {
      const mockCallback = vi.fn()
      const testFunction = createUnifiedFunction(mockCallback)
      
      // @ts-expect-error - Testing with invalid argument type
      expect(() => testFunction(123)).toThrow('Function must be called as a template literal or with string and options')
    })
  })
})  