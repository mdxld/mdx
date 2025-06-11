import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import { exportOptimalConfiguration, generateConfigurationReport } from '../src/config-manager.js'
import { saveExperimentHistory } from '../src/storage.js'

const TEST_DIR = '.ai-experiments-test'

process.env.NODE_ENV = 'test'

describe('Configuration Manager', () => {
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

  it('should export optimal configuration', async () => {
    const testHistory = {
      parameters: [
        {
          parameterType: 'model',
          parameterValue: 'gpt-4',
          rating: { rating: 1300, matches: 5, wins: 4, losses: 1, draws: 0 }
        }
      ],
      combinations: [],
      experiments: []
    }

    await saveExperimentHistory(testHistory)
    
    const configPath = '/tmp/test-config.json'
    await exportOptimalConfiguration(['model'], configPath)
    
    const configData = JSON.parse(await fs.readFile(configPath, 'utf-8'))
    expect(configData.config.model).toBe('gpt-4')
    expect(configData.metadata.totalExperiments).toBe(0)
    
    await fs.rm(configPath)
  })

  it('should generate configuration report', async () => {
    const testHistory = {
      parameters: [
        {
          parameterType: 'model',
          parameterValue: 'gpt-4',
          rating: { rating: 1300, matches: 5, wins: 4, losses: 1, draws: 0 }
        }
      ],
      combinations: [
        {
          combination: { model: 'gpt-4', temperature: 0.7 },
          rating: { rating: 1400, matches: 3, wins: 3, losses: 0, draws: 0 }
        }
      ],
      experiments: []
    }

    await saveExperimentHistory(testHistory)
    
    const report = await generateConfigurationReport()
    
    expect(report).toContain('# AI Experiments Configuration Report')
    expect(report).toContain('## Parameter Rankings')
    expect(report).toContain('## Top Combinations')
    expect(report).toContain('gpt-4')
  })
})
