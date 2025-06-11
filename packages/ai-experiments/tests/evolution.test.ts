import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import { generateOptimalConfig, evolveConfigurations } from '../src/evolution.js'
import { saveExperimentHistory } from '../src/storage.js'

const TEST_DIR = '.ai-experiments-test'

process.env.NODE_ENV = 'test'

describe('Evolution System', () => {
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

  it('should generate optimal config from ratings', async () => {
    const testHistory = {
      parameters: [
        {
          parameterType: 'model',
          parameterValue: 'gpt-4',
          rating: { rating: 1300, matches: 5, wins: 4, losses: 1, draws: 0 }
        },
        {
          parameterType: 'model',
          parameterValue: 'gpt-3.5',
          rating: { rating: 1100, matches: 5, wins: 1, losses: 4, draws: 0 }
        }
      ],
      combinations: [],
      experiments: []
    }

    await saveExperimentHistory(testHistory)
    
    const config = await generateOptimalConfig(['model'])
    
    expect(config.model).toBe('gpt-4')
  })

  it('should evolve configurations', async () => {
    const testHistory = {
      parameters: [],
      combinations: [
        {
          combination: { model: 'gpt-4', temperature: 0.7 },
          rating: { rating: 1400, matches: 3, wins: 3, losses: 0, draws: 0 }
        }
      ],
      experiments: []
    }

    await saveExperimentHistory(testHistory)

    const baseConfig = {
      model: ['gpt-4', 'gpt-3.5'],
      temperature: [0.3, 0.7, 1.0]
    }

    const evolved = await evolveConfigurations(baseConfig, { populationSize: 5 })
    
    expect(evolved).toHaveLength(5)
    expect(evolved[0]).toEqual({ model: 'gpt-4', temperature: 0.7 })
  })
})
