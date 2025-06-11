import { describe, it, expect } from 'vitest'
import { createEloRating, calculateEloUpdate } from '../src/elo.js'

describe('Elo Rating System', () => {
  it('should create default Elo rating', () => {
    const rating = createEloRating()
    expect(rating.rating).toBe(1200)
    expect(rating.matches).toBe(0)
    expect(rating.wins).toBe(0)
    expect(rating.losses).toBe(0)
    expect(rating.draws).toBe(0)
  })

  it('should calculate Elo updates correctly', () => {
    const { winnerNewRating, loserNewRating } = calculateEloUpdate(1200, 1200, 'win')
    
    expect(winnerNewRating).toBeGreaterThan(1200)
    expect(loserNewRating).toBeLessThan(1200)
    expect(Math.abs((winnerNewRating - 1200) - (1200 - loserNewRating))).toBeLessThan(0.1)
  })

  it('should handle draws correctly', () => {
    const { winnerNewRating, loserNewRating } = calculateEloUpdate(1200, 1200, 'draw')
    
    expect(winnerNewRating).toBe(1200)
    expect(loserNewRating).toBe(1200)
  })

  it('should favor underdog wins', () => {
    const { winnerNewRating, loserNewRating } = calculateEloUpdate(1000, 1400, 'win')
    
    const normalWin = calculateEloUpdate(1000, 1000, 'win')
    expect(winnerNewRating - 1000).toBeGreaterThan(normalWin.winnerNewRating - 1000)
  })
})
