import { describe, it, expect } from 'vitest'
import { cartesian } from '../src/cartesian.js'
import { experiment, experimentWithRatings } from '../src/experiment.js'

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

describe('experiment with ratings', () => {
  it('should track ratings when evaluation criteria provided', async () => {
    const mockAiFunction = async (options: any) => {
      if (options.model === 'gpt-4') {
        return 'High quality detailed response with comprehensive analysis'
      }
      return 'Basic response'
    }

    const evaluationCriteria = {
      type: 'numeric' as const,
      metric: 'length'
    }

    const result = await experimentWithRatings('rating test', {
      model: ['gpt-4', 'gpt-3.5'],
      prompt: ['detailed', 'brief']
    }, mockAiFunction, evaluationCriteria)

    expect(result.ratings).toBeDefined()
    expect(result.evaluations).toBeDefined()
    expect(result.ratings!.parameters.length).toBeGreaterThan(0)
    expect(result.ratings!.combinations.length).toBeGreaterThan(0)
  })

  it('should handle custom evaluation criteria', async () => {
    const mockAiFunction = async (options: any) => {
      return { score: options.model === 'gpt-4' ? 95 : 75 }
    }

    const evaluationCriteria = {
      type: 'custom' as const,
      compareFn: (resultA: any, resultB: any) => {
        if (resultA.score > resultB.score) return 'win'
        if (resultA.score < resultB.score) return 'loss'
        return 'draw'
      }
    }

    const result = await experimentWithRatings('custom eval test', {
      model: ['gpt-4', 'gpt-3.5']
    }, mockAiFunction, evaluationCriteria)

    expect(result.evaluations).toBeDefined()
    expect(result.evaluations!.length).toBeGreaterThan(0)
  })
})
