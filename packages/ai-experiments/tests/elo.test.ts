import { describe, it, expect } from 'vitest'
import {
  createEloRating,
  calculateExpectedScore,
  updateEloRatings,
  createParameterRating,
  createCombinationRating,
  getTopParametersByType,
  getTopCombinations,
  DEFAULT_ELO_RATING,
  ELO_K_FACTOR
} from '../src/elo.js'

describe('Elo Rating System', () => {
  describe('createEloRating', () => {
    it('should create rating with default values', () => {
      const rating = createEloRating()
      expect(rating.rating).toBe(DEFAULT_ELO_RATING)
      expect(rating.matches).toBe(0)
      expect(rating.wins).toBe(0)
      expect(rating.losses).toBe(0)
      expect(rating.draws).toBe(0)
    })

    it('should create rating with custom initial rating', () => {
      const rating = createEloRating(1500)
      expect(rating.rating).toBe(1500)
      expect(rating.matches).toBe(0)
    })
  })

  describe('calculateExpectedScore', () => {
    it('should calculate expected score correctly', () => {
      const expectedA = calculateExpectedScore(1200, 1200)
      expect(expectedA).toBeCloseTo(0.5, 2)

      const expectedB = calculateExpectedScore(1400, 1200)
      expect(expectedB).toBeGreaterThan(0.5)

      const expectedC = calculateExpectedScore(1000, 1200)
      expect(expectedC).toBeLessThan(0.5)
    })
  })

  describe('updateEloRatings', () => {
    it('should update ratings when A wins', () => {
      const ratingA = createEloRating(1200)
      const ratingB = createEloRating(1200)

      const { updatedA, updatedB } = updateEloRatings(ratingA, ratingB, {
        winner: 'A',
        isDraw: false
      })

      expect(updatedA.rating).toBeGreaterThan(1200)
      expect(updatedB.rating).toBeLessThan(1200)
      expect(updatedA.wins).toBe(1)
      expect(updatedB.losses).toBe(1)
      expect(updatedA.matches).toBe(1)
      expect(updatedB.matches).toBe(1)
    })

    it('should update ratings when B wins', () => {
      const ratingA = createEloRating(1200)
      const ratingB = createEloRating(1200)

      const { updatedA, updatedB } = updateEloRatings(ratingA, ratingB, {
        winner: 'B',
        isDraw: false
      })

      expect(updatedA.rating).toBeLessThan(1200)
      expect(updatedB.rating).toBeGreaterThan(1200)
      expect(updatedA.losses).toBe(1)
      expect(updatedB.wins).toBe(1)
    })

    it('should update ratings for draw', () => {
      const ratingA = createEloRating(1200)
      const ratingB = createEloRating(1200)

      const { updatedA, updatedB } = updateEloRatings(ratingA, ratingB, {
        isDraw: true
      })

      expect(updatedA.rating).toBe(1200)
      expect(updatedB.rating).toBe(1200)
      expect(updatedA.draws).toBe(1)
      expect(updatedB.draws).toBe(1)
    })

    it('should handle rating changes with different initial ratings', () => {
      const ratingA = createEloRating(1000) // Lower rated
      const ratingB = createEloRating(1400) // Higher rated

      const { updatedA, updatedB } = updateEloRatings(ratingA, ratingB, {
        winner: 'A', // Upset victory
        isDraw: false
      })

      const gainA = updatedA.rating - 1000
      const lossB = 1400 - updatedB.rating
      expect(gainA).toBeGreaterThanOrEqual(lossB)
    })
  })

  describe('createParameterRating', () => {
    it('should create parameter rating correctly', () => {
      const paramRating = createParameterRating('model', 'gpt-4')
      expect(paramRating.parameterType).toBe('model')
      expect(paramRating.parameterValue).toBe('gpt-4')
      expect(paramRating.rating.rating).toBe(DEFAULT_ELO_RATING)
    })
  })

  describe('createCombinationRating', () => {
    it('should create combination rating correctly', () => {
      const combination = { model: 'gpt-4', temperature: 0.7 }
      const combRating = createCombinationRating(combination)
      expect(combRating.combination).toEqual(combination)
      expect(combRating.rating.rating).toBe(DEFAULT_ELO_RATING)
    })
  })

  describe('getTopParametersByType', () => {
    it('should return top parameters sorted by rating', () => {
      const parameters = [
        createParameterRating('model', 'gpt-4'),
        createParameterRating('model', 'claude-3'),
        createParameterRating('temperature', 0.7),
      ]

      parameters[0].rating.rating = 1300
      parameters[1].rating.rating = 1400
      parameters[2].rating.rating = 1100

      const topModels = getTopParametersByType(parameters, 'model', 2)
      expect(topModels).toHaveLength(2)
      expect(topModels[0].parameterValue).toBe('claude-3') // Higher rating
      expect(topModels[1].parameterValue).toBe('gpt-4')
    })
  })

  describe('getTopCombinations', () => {
    it('should return top combinations sorted by rating', () => {
      const combinations = [
        createCombinationRating({ model: 'gpt-4', temp: 0.7 }),
        createCombinationRating({ model: 'claude-3', temp: 0.5 }),
      ]

      combinations[0].rating.rating = 1300
      combinations[1].rating.rating = 1400

      const topCombinations = getTopCombinations(combinations, 2)
      expect(topCombinations).toHaveLength(2)
      expect(topCombinations[0].combination.model).toBe('claude-3')
      expect(topCombinations[1].combination.model).toBe('gpt-4')
    })
  })
})
