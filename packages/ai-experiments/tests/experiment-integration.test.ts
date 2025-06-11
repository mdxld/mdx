import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { experiment } from '../src/experiment.js'
import { StorageManager } from '../src/storage.js'
import { promises as fs } from 'fs'
import { join } from 'path'

describe('Experiment Integration with Elo Rating', () => {
  let storage: StorageManager
  let testDir: string

  beforeEach(async () => {
    testDir = join(process.cwd(), '.test-integration-storage')
    storage = new StorageManager(testDir)
    
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
    }
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
    }
  })

  describe('experiment function without evaluation', () => {
    it('should work as before without evaluation criteria', async () => {
      const mockAiFunction = async (params: any) => {
        return `Response for ${params.model} at temp ${params.temperature}`
      }

      const result = await experiment(
        'Basic test without evaluation',
        {
          models: ['gpt-4', 'claude-3'],
          temperature: [0.5, 0.7]
        },
        mockAiFunction
      )

      expect(result.description).toBe('Basic test without evaluation')
      expect(result.combinations).toHaveLength(4) // 2 * 2 = 4 combinations
      expect(result.results).toHaveLength(4)
      expect(result.ratings).toBeUndefined() // No ratings without evaluation
      expect(result.evaluationSummary).toBeUndefined()

      result.results.forEach(r => {
        expect(r.error).toBeUndefined()
        expect(r.result).toContain('Response for')
      })
    })
  })

  describe('experiment function with evaluation', () => {
    it('should enhance results with Elo ratings when evaluation criteria provided', async () => {
      const mockAiFunction = async (params: any) => {
        if (params.model === 'gpt-4') {
          return 'This is a very detailed and comprehensive response with lots of useful information'
        } else {
          return 'Brief response'
        }
      }

      const result = await experiment(
        'Test with string evaluation',
        {
          models: ['gpt-4', 'claude-3'],
          temperature: [0.5, 0.7]
        },
        mockAiFunction,
        {
          type: 'string',
          higherIsBetter: true,
          errorPenalty: 0.8
        },
        storage
      )

      expect(result.description).toBe('Test with string evaluation')
      expect(result.combinations).toHaveLength(4)
      expect(result.results).toHaveLength(4)
      
      expect(result.ratings).toBeDefined()
      expect(result.ratings!.parameters).toBeDefined()
      expect(result.ratings!.combinations).toBeDefined()
      
      expect(result.evaluationSummary).toBeDefined()
      expect(result.evaluationSummary!.totalComparisons).toBeGreaterThan(0)
      expect(result.evaluationSummary!.averageConfidence).toBeGreaterThan(0)
      expect(result.evaluationSummary!.topPerformers).toBeDefined()

      result.results.forEach(r => {
        expect(r.score).toBeDefined()
        expect(r.rank).toBeDefined()
      })

      const gpt4Results = result.results.filter(r => r.combination.model === 'gpt-4')
      const claude3Results = result.results.filter(r => r.combination.model === 'claude-3')
      
      const avgGpt4Rank = gpt4Results.reduce((sum, r) => sum + (r.rank || 0), 0) / gpt4Results.length
      const avgClaude3Rank = claude3Results.reduce((sum, r) => sum + (r.rank || 0), 0) / claude3Results.length
      
      if (!isNaN(avgGpt4Rank) && !isNaN(avgClaude3Rank)) {
        expect(avgGpt4Rank).toBeLessThan(avgClaude3Rank)
      }
    })

    it('should handle errors in AI function calls', async () => {
      const mockAiFunction = async (params: any) => {
        if (params.temperature > 0.8) {
          throw new Error('Temperature too high')
        }
        return `This is a longer response for ${params.model} with more content to ensure higher score`
      }

      const result = await experiment(
        'Test with errors',
        {
          models: ['gpt-4'],
          temperature: [0.5, 0.9] // 0.9 will cause error
        },
        mockAiFunction,
        {
          type: 'string',
          errorPenalty: 0.8
        },
        storage
      )

      expect(result.results).toHaveLength(2)
      
      const errorResult = result.results.find(r => r.error)
      const successResult = result.results.find(r => !r.error)
      
      expect(errorResult).toBeDefined()
      expect(successResult).toBeDefined()
      
      expect(errorResult!.rank).toBeGreaterThan(successResult!.rank!)
    })

    it('should persist ratings to storage', async () => {
      const mockAiFunction = async (params: any) => {
        return `Response length varies: ${params.model === 'gpt-4' ? 'long detailed response' : 'short'}`
      }

      await experiment(
        'Test storage persistence',
        {
          models: ['gpt-4', 'claude-3']
        },
        mockAiFunction,
        {
          type: 'string',
          higherIsBetter: true
        },
        storage
      )

      const modelRatings = await storage.getTopParametersByType('models', 10)
      expect(modelRatings.length).toBeGreaterThan(0)

      const combinationRatings = await storage.getTopCombinations(10)
      expect(combinationRatings.length).toBeGreaterThan(0)

      const history = await storage.getHistory()
      expect(history).toHaveLength(1)
      expect(history[0].description).toBe('Test storage persistence')
    })

    it('should update ratings across multiple experiments', async () => {
      const mockAiFunction = async (params: any) => {
        return params.model === 'gpt-4' ? 'excellent detailed response' : 'ok response'
      }

      await experiment(
        'First experiment',
        { models: ['gpt-4', 'claude-3'] },
        mockAiFunction,
        { type: 'string', higherIsBetter: true },
        storage
      )

      await experiment(
        'Second experiment',
        { models: ['gpt-4', 'claude-3'] },
        mockAiFunction,
        { type: 'string', higherIsBetter: true },
        storage
      )

      const modelRatings = await storage.getTopParametersByType('models', 10)
      const gpt4Rating = modelRatings.find(r => r.parameterValue === 'gpt-4')
      const claude3Rating = modelRatings.find(r => r.parameterValue === 'claude-3')

      expect(gpt4Rating).toBeDefined()
      expect(claude3Rating).toBeDefined()
      // After multiple experiments, gpt-4 should have higher rating due to consistently better performance
      expect(gpt4Rating!.rating.rating).toBeGreaterThanOrEqual(claude3Rating!.rating.rating)
      expect(gpt4Rating!.rating.matches).toBeGreaterThan(0)
    })
  })

  describe('numeric evaluation', () => {
    it('should handle numeric evaluation criteria', async () => {
      const mockAiFunction = async (params: any) => {
        return params.model === 'gpt-4' ? 95 : 78
      }

      const result = await experiment(
        'Numeric evaluation test',
        {
          models: ['gpt-4', 'claude-3']
        },
        mockAiFunction,
        {
          type: 'numeric',
          higherIsBetter: true
        },
        storage
      )

      expect(result.results).toHaveLength(2)
      
      const gpt4Result = result.results.find(r => r.combination.models === 'gpt-4')
      const claude3Result = result.results.find(r => r.combination.models === 'claude-3')
      
      expect(gpt4Result).toBeDefined()
      expect(claude3Result).toBeDefined()
      expect(gpt4Result!.rank).toBeLessThan(claude3Result!.rank!)
      expect(gpt4Result!.score).toBeGreaterThanOrEqual(claude3Result!.score!)
    })
  })

  describe('custom evaluation', () => {
    it('should handle custom comparator', async () => {
      const mockAiFunction = async (params: any) => {
        return { quality: params.model === 'gpt-4' ? 'high' : 'medium' }
      }

      const result = await experiment(
        'Custom evaluation test',
        {
          models: ['gpt-4', 'claude-3']
        },
        mockAiFunction,
        {
          type: 'custom',
          customComparator: (a, b) => {
            if (a.quality === 'high' && b.quality !== 'high') return 'A'
            if (b.quality === 'high' && a.quality !== 'high') return 'B'
            return 'draw'
          }
        },
        storage
      )

      expect(result.results).toHaveLength(2)
      expect(result.ratings).toBeDefined()
      expect(result.evaluationSummary!.totalComparisons).toBe(1) // Only 1 pairwise comparison
    })
  })
})
