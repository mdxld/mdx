import { describe, it, expect } from 'vitest'
import { cartesian } from '../src/cartesian.js'
import { experiment } from '../src/experiment.js'

describe('cartesian', () => {
  it('should generate cartesian product of simple arrays', () => {
    const result = cartesian({ a: [1, 2], b: ['x', 'y'] })
    expect(result).toEqual([
      { a: 1, b: 'x' },
      { a: 1, b: 'y' },
      { a: 2, b: 'x' },
      { a: 2, b: 'y' }
    ])
  })

  it('should handle empty input', () => {
    const result = cartesian({})
    expect(result).toEqual([])
  })

  it('should handle single parameter', () => {
    const result = cartesian({ models: ['gpt-4', 'claude-3'] })
    expect(result).toEqual([
      { models: 'gpt-4' },
      { models: 'claude-3' }
    ])
  })
})

describe('experiment', () => {
  it('should execute AI function with parameter combinations', async () => {
    const mockAiFunction = async (options: any) => {
      return `Result for ${options.model} with ${options.prompt}`
    }

    const result = await experiment('test experiment', {
      model: ['gpt-4', 'claude-3'],
      prompt: ['brief', 'detailed']
    }, mockAiFunction)

    expect(result.description).toBe('test experiment')
    expect(result.combinations).toHaveLength(4)
    expect(result.results).toHaveLength(4)
    
    expect(result.results[0].result).toBe('Result for gpt-4 with brief')
    expect(result.results[1].result).toBe('Result for gpt-4 with detailed')
    expect(result.results[2].result).toBe('Result for claude-3 with brief')
    expect(result.results[3].result).toBe('Result for claude-3 with detailed')
  })

  it('should handle AI function errors gracefully', async () => {
    const mockAiFunction = async (options: any) => {
      if (options.model === 'error-model') {
        throw new Error('Test error')
      }
      return `Success for ${options.model}`
    }

    const result = await experiment('error test', {
      model: ['gpt-4', 'error-model']
    }, mockAiFunction)

    expect(result.results).toHaveLength(2)
    expect(result.results[0].result).toBe('Success for gpt-4')
    expect(result.results[0].error).toBeUndefined()
    
    expect(result.results[1].result).toBeNull()
    expect(result.results[1].error).toBe('Test error')
  })
})
