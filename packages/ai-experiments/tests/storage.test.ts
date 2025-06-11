import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { loadExperimentHistory, saveExperimentHistory, updateRatings } from '../src/storage.js'

const TEST_DIR = '.ai-experiments-test'

process.env.NODE_ENV = 'test'

describe('Storage System', () => {
  beforeEach(async () => {
    process.chdir('/tmp')
    try {
      await fs.rm(TEST_DIR, { recursive: true })
    } catch {}
  })

  afterEach(async () => {
    try {
      await fs.rm(TEST_DIR, { recursive: true })
    } catch {}
  })

  it('should create empty history when file does not exist', async () => {
    const history = await loadExperimentHistory()
    
    expect(history.parameters).toEqual([])
    expect(history.combinations).toEqual([])
    expect(history.experiments).toEqual([])
  })

  it('should save and load experiment history', async () => {
    const testHistory = {
      parameters: [],
      combinations: [],
      experiments: [{
        timestamp: Date.now(),
        description: 'test',
        results: [],
        evaluations: []
      }]
    }

    await saveExperimentHistory(testHistory)
    const loaded = await loadExperimentHistory()
    
    expect(loaded.experiments).toHaveLength(1)
    expect(loaded.experiments[0].description).toBe('test')
  })

  it('should update ratings correctly', async () => {
    const results = [
      { combination: { model: 'gpt-4' }, result: 'Good result' },
      { combination: { model: 'gpt-3.5' }, result: 'Bad result' }
    ]

    const evaluations = [
      { winner: 0, loser: 1, outcome: 'win' as const }
    ]

    const ratings = await updateRatings(results, evaluations, 'test experiment')
    
    expect(ratings.parameters.length).toBe(2)
    expect(ratings.combinations.length).toBe(2)
    
    const gpt4Param = ratings.parameters.find(p => p.parameterValue === 'gpt-4')
    const gpt35Param = ratings.parameters.find(p => p.parameterValue === 'gpt-3.5')
    
    expect(gpt4Param?.rating.wins).toBe(1)
    expect(gpt4Param?.rating.losses).toBe(0)
    expect(gpt35Param?.rating.wins).toBe(0)
    expect(gpt35Param?.rating.losses).toBe(1)
  })
})
