import { describe, it, expect } from 'vitest'
import { evaluateResults } from '../src/evaluation.js'

describe('Evaluation System', () => {
  it('should evaluate numeric results correctly', async () => {
    const results = [
      { combination: { model: 'gpt-4' }, result: 'This is a longer response' },
      { combination: { model: 'gpt-3.5' }, result: 'Short' }
    ]

    const criteria = {
      type: 'numeric' as const,
      metric: 'length'
    }

    const evaluations = await evaluateResults(results, criteria)
    
    expect(evaluations).toHaveLength(1)
    expect(evaluations[0].winner).toBe(0)
    expect(evaluations[0].loser).toBe(1)
    expect(evaluations[0].outcome).toBe('win')
  })

  it('should handle custom evaluation functions', async () => {
    const results = [
      { combination: { model: 'gpt-4' }, result: { quality: 9 } },
      { combination: { model: 'gpt-3.5' }, result: { quality: 7 } }
    ]

    const criteria = {
      type: 'custom' as const,
      compareFn: (resultA: any, resultB: any) => {
        if (resultA.quality > resultB.quality) return 'win'
        if (resultA.quality < resultB.quality) return 'loss'
        return 'draw'
      }
    }

    const evaluations = await evaluateResults(results, criteria)
    
    expect(evaluations).toHaveLength(1)
    expect(evaluations[0].winner).toBe(0)
    expect(evaluations[0].outcome).toBe('win')
  })

  it('should skip results with errors', async () => {
    const results = [
      { combination: { model: 'gpt-4' }, result: 'Good result' },
      { combination: { model: 'error-model' }, result: null, error: 'Test error' }
    ]

    const criteria = {
      type: 'numeric' as const,
      metric: 'length'
    }

    const evaluations = await evaluateResults(results, criteria)
    
    expect(evaluations).toHaveLength(0)
  })
})
