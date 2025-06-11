import { createUnifiedFunction } from '../../mdxai/src/utils/template.js'
import { cartesian } from './cartesian.js'
import { EvaluationCriteria, evaluateExperimentBatch, EvaluatedResult } from './evaluation.js'
import { ParameterRating, CombinationRating, updateEloRatings, MatchOutcome } from './elo.js'
import { StorageManager, ExperimentHistory } from './storage.js'

export interface ExperimentConfig {
  models?: string[]
  prompts?: string[]
  [key: string]: any
}

export interface ExperimentResult {
  description: string
  combinations: Array<Record<string, any>>
  results: Array<{
    combination: Record<string, any>
    result: any
    error?: string
    score?: number
    rank?: number
  }>
  ratings?: {
    parameters: ParameterRating[]
    combinations: CombinationRating[]
  }
  evaluationSummary?: {
    totalComparisons: number
    averageConfidence: number
    topPerformers: Array<{
      combination: Record<string, any>
      rating: number
      rank: number
    }>
  }
}

/**
 * Core experiment function that runs AI functions with different parameter combinations
 */
async function experimentCore(
  description: string,
  config: ExperimentConfig,
  aiFunction: any
): Promise<ExperimentResult> {
  const combinations = cartesian(config)
  
  if (combinations.length === 0) {
    throw new Error('No parameter combinations found. Please provide at least one parameter array.')
  }

  const results = await Promise.allSettled(
    combinations.map(async (combination) => {
      try {
        const result = await aiFunction(combination)
        return {
          combination,
          result,
        }
      } catch (error) {
        return {
          combination,
          result: null,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    })
  )

  const processedResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        combination: combinations[index],
        result: null,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      }
    }
  })

  return {
    description,
    combinations,
    results: processedResults,
  }
}

/**
 * Experiment function with streamlined syntax for running AI functions with different parameter combinations
 * 
 * This function needs to be called directly with three parameters since it doesn't follow the template literal pattern.
 * 
 * Usage:
 * ```typescript
 * import { research } from 'mdxai'
 * 
 * const aiFunc = research`the potential impact of AGI on unemployment for software engineers`
 * const results = await experiment('with different research approaches', {
 *   models: ['gpt-4', 'claude-3'],
 *   prompts: ['detailed analysis', 'brief summary']
 * }, aiFunc)
 * ```
 * 
 * With Elo rating evaluation:
 * ```typescript
 * const results = await experiment('with different research approaches', {
 *   models: ['gpt-4', 'claude-3'],
 *   prompts: ['detailed analysis', 'brief summary']
 * }, aiFunc, {
 *   type: 'string',
 *   higherIsBetter: true,
 *   errorPenalty: 0.8
 * })
 * ```
 */
export async function experiment(
  description: string,
  config: ExperimentConfig,
  aiFunction: any,
  evaluationCriteria?: EvaluationCriteria,
  storage?: StorageManager
): Promise<ExperimentResult> {
  const result = await experimentCore(description, config, aiFunction)
  
  if (evaluationCriteria) {
    return await enhanceWithEloRatings(result, evaluationCriteria, storage)
  }
  
  return result
}

/**
 * Enhance experiment results with Elo ratings and evaluation
 */
async function enhanceWithEloRatings(
  result: ExperimentResult,
  criteria: EvaluationCriteria,
  storageManager?: StorageManager
): Promise<ExperimentResult> {
  const storage = storageManager || new StorageManager()
  
  const { evaluatedResults, comparisons } = evaluateExperimentBatch(result.results, criteria)
  
  result.results = evaluatedResults
  
  const parameterRatings = new Map<string, ParameterRating>()
  const combinationRatings = new Map<string, CombinationRating>()
  
  for (const evaluatedResult of evaluatedResults) {
    const { combination } = evaluatedResult
    
    for (const [paramType, paramValue] of Object.entries(combination)) {
      const key = `${paramType}:${JSON.stringify(paramValue)}`
      if (!parameterRatings.has(key)) {
        const rating = await storage.findOrCreateParameterRating(paramType, paramValue)
        parameterRatings.set(key, rating)
      }
    }
    
    const combKey = JSON.stringify(combination)
    if (!combinationRatings.has(combKey)) {
      const rating = await storage.findOrCreateCombinationRating(combination)
      combinationRatings.set(combKey, rating)
    }
  }
  
  let totalComparisons = 0
  let totalConfidence = 0
  
  for (const comparison of comparisons) {
    const { indexA, indexB, comparison: compResult } = comparison
    const resultA = evaluatedResults[indexA]
    const resultB = evaluatedResults[indexB]
    
    if (compResult.confidence < 0.3) {
      continue // Skip low-confidence comparisons
    }
    
    totalComparisons++
    totalConfidence += compResult.confidence
    
    const outcome: MatchOutcome = {
      winner: compResult.winner,
      isDraw: compResult.isDraw
    }
    
    const combKeyA = JSON.stringify(resultA.combination)
    const combKeyB = JSON.stringify(resultB.combination)
    const combRatingA = combinationRatings.get(combKeyA)!
    const combRatingB = combinationRatings.get(combKeyB)!
    
    const { updatedA: newCombRatingA, updatedB: newCombRatingB } = updateEloRatings(
      combRatingA.rating,
      combRatingB.rating,
      outcome
    )
    
    combRatingA.rating = newCombRatingA
    combRatingB.rating = newCombRatingB
    
    for (const paramType of Object.keys(resultA.combination)) {
      const valueA = resultA.combination[paramType]
      const valueB = resultB.combination[paramType]
      
      if (JSON.stringify(valueA) !== JSON.stringify(valueB)) {
        const keyA = `${paramType}:${JSON.stringify(valueA)}`
        const keyB = `${paramType}:${JSON.stringify(valueB)}`
        const paramRatingA = parameterRatings.get(keyA)!
        const paramRatingB = parameterRatings.get(keyB)!
        
        const { updatedA: newParamRatingA, updatedB: newParamRatingB } = updateEloRatings(
          paramRatingA.rating,
          paramRatingB.rating,
          outcome
        )
        
        paramRatingA.rating = newParamRatingA
        paramRatingB.rating = newParamRatingB
      }
    }
  }
  
  for (const [key, rating] of parameterRatings) {
    const colonIndex = key.indexOf(':')
    const paramType = key.substring(0, colonIndex)
    const paramValueJson = key.substring(colonIndex + 1)
    const paramValue = JSON.parse(paramValueJson)
    await storage.updateParameterRating(paramType, paramValue, rating.rating)
  }
  
  for (const [key, rating] of combinationRatings) {
    const combination = JSON.parse(key)
    await storage.updateCombinationRating(combination, rating.rating)
  }
  
  const experimentHistory: ExperimentHistory = {
    timestamp: Date.now(),
    description: result.description,
    combinations: result.combinations,
    results: evaluatedResults,
    comparisons: comparisons.map(c => ({
      indexA: c.indexA,
      indexB: c.indexB,
      winner: c.comparison.winner,
      isDraw: c.comparison.isDraw,
      confidence: c.comparison.confidence
    }))
  }
  
  await storage.addExperimentHistory(experimentHistory)
  
  const sortedParameterRatings = Array.from(parameterRatings.values())
    .sort((a, b) => b.rating.rating - a.rating.rating)
  
  const sortedCombinationRatings = Array.from(combinationRatings.values())
    .sort((a, b) => b.rating.rating - a.rating.rating)
  
  result.ratings = {
    parameters: sortedParameterRatings,
    combinations: sortedCombinationRatings
  }
  
  result.evaluationSummary = {
    totalComparisons,
    averageConfidence: totalComparisons > 0 ? totalConfidence / totalComparisons : 0,
    topPerformers: sortedCombinationRatings.slice(0, 3).map((rating, index) => ({
      combination: rating.combination,
      rating: rating.rating.rating,
      rank: index + 1
    }))
  }
  
  return result
}
