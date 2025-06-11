import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { StorageManager } from '../src/storage.js'
import { createParameterRating, createCombinationRating } from '../src/elo.js'
import { promises as fs } from 'fs'
import { join } from 'path'

describe('Storage System', () => {
  let storage: StorageManager
  let testDir: string

  beforeEach(async () => {
    testDir = join(process.cwd(), '.test-storage')
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

  describe('loadRatings and saveRatings', () => {
    it('should create empty storage when no file exists', async () => {
      const ratings = await storage.loadRatings()
      
      expect(ratings.parameters).toEqual([])
      expect(ratings.combinations).toEqual([])
      expect(ratings.history).toEqual([])
      expect(ratings.lastUpdated).toBeTypeOf('number')
    })

    it('should save and load ratings correctly', async () => {
      const testRating = createParameterRating('model', 'gpt-4', 1300)
      const testStorage = {
        parameters: [testRating],
        combinations: [],
        history: [],
        lastUpdated: Date.now()
      }

      await storage.saveRatings(testStorage)
      const loaded = await storage.loadRatings()

      expect(loaded.parameters).toHaveLength(1)
      expect(loaded.parameters[0].parameterType).toBe('model')
      expect(loaded.parameters[0].parameterValue).toBe('gpt-4')
      expect(loaded.parameters[0].rating.rating).toBe(1300)
    })
  })

  describe('findOrCreateParameterRating', () => {
    it('should create new parameter rating when not found', async () => {
      const rating = await storage.findOrCreateParameterRating('model', 'gpt-4')
      
      expect(rating.parameterType).toBe('model')
      expect(rating.parameterValue).toBe('gpt-4')
      expect(rating.rating.rating).toBe(1200) // Default rating
    })

    it('should return existing parameter rating when found', async () => {
      const rating1 = await storage.findOrCreateParameterRating('model', 'gpt-4')
      rating1.rating.rating = 1400

      const storageData = await storage.loadRatings()
      storageData.parameters[0] = rating1
      await storage.saveRatings(storageData)

      const rating2 = await storage.findOrCreateParameterRating('model', 'gpt-4')
      expect(rating2.rating.rating).toBe(1400)
    })

    it('should handle complex parameter values', async () => {
      const complexValue = { temperature: 0.7, maxTokens: 100 }
      const rating = await storage.findOrCreateParameterRating('config', complexValue)
      
      expect(rating.parameterValue).toEqual(complexValue)
    })
  })

  describe('findOrCreateCombinationRating', () => {
    it('should create new combination rating when not found', async () => {
      const combination = { model: 'gpt-4', temperature: 0.7 }
      const rating = await storage.findOrCreateCombinationRating(combination)
      
      expect(rating.combination).toEqual(combination)
      expect(rating.rating.rating).toBe(1200)
    })

    it('should return existing combination rating when found', async () => {
      const combination = { model: 'gpt-4', temperature: 0.7 }
      
      const rating1 = await storage.findOrCreateCombinationRating(combination)
      rating1.rating.rating = 1500

      const storageData = await storage.loadRatings()
      storageData.combinations[0] = rating1
      await storage.saveRatings(storageData)

      const rating2 = await storage.findOrCreateCombinationRating(combination)
      expect(rating2.rating.rating).toBe(1500)
    })
  })

  describe('updateParameterRating', () => {
    it('should update existing parameter rating', async () => {
      await storage.findOrCreateParameterRating('model', 'gpt-4')
      
      const newRating = {
        rating: 1400,
        matches: 5,
        wins: 3,
        losses: 2,
        draws: 0
      }
      
      await storage.updateParameterRating('model', 'gpt-4', newRating)
      
      const updated = await storage.findOrCreateParameterRating('model', 'gpt-4')
      expect(updated.rating.rating).toBe(1400)
      expect(updated.rating.wins).toBe(3)
    })
  })

  describe('getTopParametersByType', () => {
    it('should return top parameters sorted by rating', async () => {
      const param1 = await storage.findOrCreateParameterRating('model', 'gpt-4')
      const param2 = await storage.findOrCreateParameterRating('model', 'claude-3')
      const param3 = await storage.findOrCreateParameterRating('temperature', 0.7)
      
      await storage.updateParameterRating('model', 'gpt-4', { ...param1.rating, rating: 1300 })
      await storage.updateParameterRating('model', 'claude-3', { ...param2.rating, rating: 1400 })
      await storage.updateParameterRating('temperature', 0.7, { ...param3.rating, rating: 1100 })
      
      const topModels = await storage.getTopParametersByType('model', 5)
      
      expect(topModels).toHaveLength(2)
      expect(topModels[0].parameterValue).toBe('claude-3') // Higher rating
      expect(topModels[1].parameterValue).toBe('gpt-4')
    })
  })

  describe('addExperimentHistory', () => {
    it('should add experiment to history', async () => {
      const experiment = {
        timestamp: Date.now(),
        description: 'Test experiment',
        combinations: [{ model: 'gpt-4' }],
        results: [{
          combination: { model: 'gpt-4' },
          result: 'test result',
          score: 85,
          rank: 1
        }]
      }

      await storage.addExperimentHistory(experiment)
      
      const history = await storage.getHistory()
      expect(history).toHaveLength(1)
      expect(history[0].description).toBe('Test experiment')
    })

    it('should limit history to 1000 entries', async () => {
      const experiment = {
        timestamp: Date.now(),
        description: 'Test experiment',
        combinations: [],
        results: []
      }

      await storage.addExperimentHistory(experiment)
      const history = await storage.getHistory()
      expect(history.length).toBeLessThanOrEqual(1000)
    })
  })

  describe('clearAll', () => {
    it('should clear all stored data', async () => {
      await storage.findOrCreateParameterRating('model', 'gpt-4')
      await storage.addExperimentHistory({
        timestamp: Date.now(),
        description: 'Test',
        combinations: [],
        results: []
      })

      await storage.clearAll()

      const ratings = await storage.loadRatings()
      expect(ratings.parameters).toEqual([])
      expect(ratings.combinations).toEqual([])
      expect(ratings.history).toEqual([])
    })
  })

  describe('exportRatings', () => {
    it('should export ratings as JSON', async () => {
      await storage.findOrCreateParameterRating('model', 'gpt-4')
      
      const exported = await storage.exportRatings('json')
      const parsed = JSON.parse(exported)
      
      expect(parsed.parameters).toHaveLength(1)
      expect(parsed.parameters[0].parameterType).toBe('model')
    })

    it('should export ratings as CSV', async () => {
      await storage.findOrCreateParameterRating('model', 'gpt-4')
      
      const exported = await storage.exportRatings('csv')
      const lines = exported.split('\n')
      
      expect(lines[0]).toContain('Type,Value,Rating,Matches,Wins,Losses,Draws')
      expect(lines[1]).toContain('model,"gpt-4",1200,0,0,0,0')
    })
  })
})
