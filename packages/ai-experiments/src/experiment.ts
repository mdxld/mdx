import { createUnifiedFunction } from '../../mdxai/src/utils/template.js'
import { cartesian } from './cartesian.js'

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
  }>
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
 */
export async function experiment(
  description: string,
  config: ExperimentConfig,
  aiFunction: any
): Promise<ExperimentResult> {
  return experimentCore(description, config, aiFunction)
}
