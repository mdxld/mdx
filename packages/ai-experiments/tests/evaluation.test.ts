import { describe, it, expect } from 'vitest'
import {
  evaluateResults,
  compareResults,
  evaluateExperimentBatch,
  type EvaluationCriteria
} from '../src/evaluation.js'

describe('Evaluation System', () => {
  const mockResults = [
    {
      combination: { model: 'gpt-4', temperature: 0.7 },
      result: 'Good response with detailed analysis',
      error: undefined
    },
    {
      combination: { model: 'claude-3', temperature: 0.5 },
      result: 'Brief response',
      error: undefined
    },
    {
      combination: { model: 'gpt-3.5', temperature: 0.9 },
      result: null,
      error: 'API timeout'
    }
  ]

  describe('evaluateResults', () => {
    it('should evaluate string results with length-based scoring', () => {
      const criteria: EvaluationCriteria = {
        type: 'string',
        higherIsBetter: true
      }

      const evaluated = evaluateResults(mockResults, criteria)
      
      expect(evaluated).toHaveLength(3)
      expect(evaluated[0].rank).toBe(1) // Longest string should rank first
      expect(evaluated[2].rank).toBe(3) // Error should rank last
      expect(evaluated[2].score).toBeLessThan(evaluated[1].score!)
    })

    it('should evaluate numeric results', () => {
      const numericResults = [
        { combination: { model: 'a' }, result: 85 },
        { combination: { model: 'b' }, result: 92 },
        { combination: { model: 'c' }, result: 78 }
      ]

      const criteria: EvaluationCriteria = {
        type: 'numeric',
        higherIsBetter: true
      }

      const evaluated = evaluateResults(numericResults, criteria)
      
      expect(evaluated[0].result).toBe(92) // Highest score first
      expect(evaluated[0].rank).toBe(1)
      expect(evaluated[2].result).toBe(78) // Lowest score last
    })

    it('should evaluate boolean results', () => {
      const booleanResults = [
        { combination: { model: 'a' }, result: true },
        { combination: { model: 'b' }, result: false },
        { combination: { model: 'c' }, result: true }
      ]

      const criteria: EvaluationCriteria = {
        type: 'boolean',
        higherIsBetter: true
      }

      const evaluated = evaluateResults(booleanResults, criteria)
      
      const trueResults = evaluated.filter(r => r.result === true)
      const falseResults = evaluated.filter(r => r.result === false)
      
      expect(trueResults[0].score).toBe(100)
      expect(falseResults[0].score).toBe(0)
    })

    it('should handle errors with penalty', () => {
      const criteria: EvaluationCriteria = {
        type: 'string',
        errorPenalty: 0.8
      }

      const evaluated = evaluateResults(mockResults, criteria)
      const errorResult = evaluated.find(r => r.error)
      
      expect(errorResult?.score).toBeCloseTo(20, 1) // (1 - 0.8) * 100
    })

    it('should extract metrics from nested objects', () => {
      const complexResults = [
        { 
          combination: { model: 'a' }, 
          result: { metrics: { accuracy: 0.95 } }
        },
        { 
          combination: { model: 'b' }, 
          result: { metrics: { accuracy: 0.87 } }
        }
      ]

      const criteria: EvaluationCriteria = {
        type: 'numeric',
        metric: 'metrics.accuracy',
        higherIsBetter: true
      }

      const evaluated = evaluateResults(complexResults, criteria)
      
      expect(evaluated[0].result.metrics.accuracy).toBe(0.95)
      expect(evaluated[0].rank).toBe(1)
    })
  })

  describe('compareResults', () => {
    it('should compare results with clear winner', () => {
      const resultA = {
        combination: { model: 'a' },
        result: 'long response',
        score: 80
      }
      const resultB = {
        combination: { model: 'b' },
        result: 'short',
        score: 40
      }

      const criteria: EvaluationCriteria = { type: 'string' }
      const comparison = compareResults(resultA, resultB, criteria)

      expect(comparison.winner).toBe('A')
      expect(comparison.isDraw).toBe(false)
      expect(comparison.confidence).toBeGreaterThan(0.5)
    })

    it('should detect draws for close scores', () => {
      const resultA = {
        combination: { model: 'a' },
        result: 'response',
        score: 50.5
      }
      const resultB = {
        combination: { model: 'b' },
        result: 'response',
        score: 50.0
      }

      const criteria: EvaluationCriteria = { type: 'string' }
      const comparison = compareResults(resultA, resultB, criteria)

      expect(comparison.isDraw).toBe(true)
    })

    it('should handle errors in comparison', () => {
      const resultA = {
        combination: { model: 'a' },
        result: 'good response',
        error: undefined
      }
      const resultB = {
        combination: { model: 'b' },
        result: null,
        error: 'API failed'
      }

      const criteria: EvaluationCriteria = { type: 'string' }
      const comparison = compareResults(resultA, resultB, criteria)

      expect(comparison.winner).toBe('A')
      expect(comparison.confidence).toBeGreaterThan(0.8)
      expect(comparison.reason).toContain('error')
    })

    it('should use custom comparator when provided', () => {
      const resultA = { combination: { model: 'a' }, result: 'A' }
      const resultB = { combination: { model: 'b' }, result: 'B' }

      const criteria: EvaluationCriteria = {
        type: 'custom',
        customComparator: (a, b) => a === 'A' ? 'A' : 'B'
      }

      const comparison = compareResults(resultA, resultB, criteria)
      expect(comparison.winner).toBe('A')
    })
  })

  describe('evaluateExperimentBatch', () => {
    it('should evaluate batch and generate pairwise comparisons', () => {
      const criteria: EvaluationCriteria = {
        type: 'string',
        higherIsBetter: true
      }

      const { evaluatedResults, comparisons } = evaluateExperimentBatch(mockResults, criteria)

      expect(evaluatedResults).toHaveLength(3)
      expect(comparisons).toHaveLength(3) // 3 choose 2 = 3 comparisons
      
      comparisons.forEach(comp => {
        expect(comp).toHaveProperty('indexA')
        expect(comp).toHaveProperty('indexB')
        expect(comp).toHaveProperty('comparison')
        expect(comp.comparison).toHaveProperty('confidence')
      })
    })

    it('should rank results correctly', () => {
      const criteria: EvaluationCriteria = {
        type: 'string',
        higherIsBetter: true
      }

      const { evaluatedResults } = evaluateExperimentBatch(mockResults, criteria)
      
      for (let i = 0; i < evaluatedResults.length - 1; i++) {
        expect(evaluatedResults[i].score).toBeGreaterThanOrEqual(evaluatedResults[i + 1].score!)
        expect(evaluatedResults[i].rank).toBeLessThanOrEqual(evaluatedResults[i + 1].rank!)
      }
    })
  })
})
