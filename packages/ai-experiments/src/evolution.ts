/**
 * Evolution engine for generating optimal parameter configurations
 */

import { ParameterRating, CombinationRating, getTopParametersByType, getTopCombinations } from './elo.js';
import { StorageManager } from './storage.js';
import { cartesian } from './cartesian.js';

export interface EvolutionConfig {
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  eliteCount: number;
  maxGenerations: number;
}

export interface OptimalConfiguration {
  combination: Record<string, any>;
  confidence: number;
  generation: number;
  parentCombinations?: Array<Record<string, any>>;
}

export interface EvolutionResult {
  optimalConfigurations: OptimalConfiguration[];
  generationsRun: number;
  convergenceReached: boolean;
  averageRating: number;
}

/**
 * Default evolution configuration
 */
export const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = {
  populationSize: 20,
  mutationRate: 0.1,
  crossoverRate: 0.7,
  eliteCount: 5,
  maxGenerations: 10,
};

/**
 * Evolution engine class
 */
export class EvolutionEngine {
  private storage: StorageManager;
  private config: EvolutionConfig;

  constructor(storage: StorageManager, config: EvolutionConfig = DEFAULT_EVOLUTION_CONFIG) {
    this.storage = storage;
    this.config = config;
  }

  /**
   * Generate optimal configurations based on current ratings
   */
  async generateOptimalConfigurations(
    parameterTypes: string[],
    targetCount: number = 5
  ): Promise<OptimalConfiguration[]> {
    const topParametersByType: Record<string, ParameterRating[]> = {};
    
    for (const parameterType of parameterTypes) {
      topParametersByType[parameterType] = await this.storage.getTopParametersByType(
        parameterType,
        Math.min(10, this.config.populationSize)
      );
    }

    const parameterSpec: Record<string, any[]> = {};
    for (const [type, ratings] of Object.entries(topParametersByType)) {
      if (ratings.length > 0) {
        parameterSpec[type] = ratings.map(r => r.parameterValue);
      }
    }

    if (Object.keys(parameterSpec).length === 0) {
      return [];
    }

    const combinations = cartesian(parameterSpec);
    
    const combinationRatings = await this.storage.getTopCombinations(100);
    const ratingMap = new Map<string, number>();
    
    for (const rating of combinationRatings) {
      ratingMap.set(JSON.stringify(rating.combination), rating.rating.rating);
    }

    const scoredCombinations = combinations.map(combination => {
      let score = 0;
      let parameterCount = 0;

      for (const [type, value] of Object.entries(combination)) {
        const parameterRating = topParametersByType[type]?.find(
          p => JSON.stringify(p.parameterValue) === JSON.stringify(value)
        );
        if (parameterRating) {
          score += parameterRating.rating.rating;
          parameterCount++;
        }
      }

      const parameterScore = parameterCount > 0 ? score / parameterCount : 1200;

      const combinationKey = JSON.stringify(combination);
      const combinationScore = ratingMap.get(combinationKey) || 1200;

      const finalScore = (parameterScore * 0.6) + (combinationScore * 0.4);

      return {
        combination,
        score: finalScore,
        confidence: Math.min(0.95, Math.max(0.1, (finalScore - 1000) / 400)),
      };
    });

    scoredCombinations.sort((a, b) => b.score - a.score);
    
    return scoredCombinations.slice(0, targetCount).map((config, index) => ({
      combination: config.combination,
      confidence: config.confidence,
      generation: 0,
    }));
  }

  /**
   * Evolve configurations through genetic algorithm
   */
  async evolveConfigurations(
    initialPopulation: Array<Record<string, any>>,
    parameterTypes: string[]
  ): Promise<EvolutionResult> {
    let population = [...initialPopulation];
    let generation = 0;
    let previousBestScore = 0;
    let convergenceCount = 0;

    while (population.length < this.config.populationSize) {
      const optimal = await this.generateOptimalConfigurations(parameterTypes, 1);
      if (optimal.length > 0) {
        population.push(optimal[0].combination);
      } else {
        break;
      }
    }

    for (generation = 0; generation < this.config.maxGenerations; generation++) {
      const evaluatedPopulation = await this.evaluatePopulation(population);
      
      const bestScore = evaluatedPopulation[0].score;
      if (Math.abs(bestScore - previousBestScore) < 10) {
        convergenceCount++;
      } else {
        convergenceCount = 0;
      }

      if (convergenceCount >= 3) {
        break; // Converged
      }

      previousBestScore = bestScore;

      const elite = evaluatedPopulation.slice(0, this.config.eliteCount);

      const newPopulation: Array<Record<string, any>> = elite.map(e => e.combination);

      while (newPopulation.length < this.config.populationSize) {
        if (Math.random() < this.config.crossoverRate) {
          const parent1 = this.selectParent(evaluatedPopulation);
          const parent2 = this.selectParent(evaluatedPopulation);
          const offspring = this.crossover(parent1.combination, parent2.combination);
          newPopulation.push(offspring);
        } else {
          const parent = this.selectParent(evaluatedPopulation);
          const mutated = await this.mutate(parent.combination, parameterTypes);
          newPopulation.push(mutated);
        }
      }

      population = newPopulation;
    }

    const finalPopulation = await this.evaluatePopulation(population);
    const averageRating = finalPopulation.reduce((sum, p) => sum + p.score, 0) / finalPopulation.length;

    return {
      optimalConfigurations: finalPopulation.slice(0, 5).map((config, index) => ({
        combination: config.combination,
        confidence: Math.min(0.95, Math.max(0.1, (config.score - 1000) / 400)),
        generation,
      })),
      generationsRun: generation + 1,
      convergenceReached: convergenceCount >= 3,
      averageRating,
    };
  }

  /**
   * Evaluate population fitness
   */
  private async evaluatePopulation(
    population: Array<Record<string, any>>
  ): Promise<Array<{ combination: Record<string, any>; score: number }>> {
    const combinationRatings = await this.storage.getTopCombinations(1000);
    const ratingMap = new Map<string, number>();
    
    for (const rating of combinationRatings) {
      ratingMap.set(JSON.stringify(rating.combination), rating.rating.rating);
    }

    const evaluated = population.map(combination => {
      const key = JSON.stringify(combination);
      const score = ratingMap.get(key) || 1200; // Default rating
      return { combination, score };
    });

    evaluated.sort((a, b) => b.score - a.score);
    return evaluated;
  }

  /**
   * Select parent using tournament selection
   */
  private selectParent(
    population: Array<{ combination: Record<string, any>; score: number }>
  ): { combination: Record<string, any>; score: number } {
    const tournamentSize = Math.min(3, population.length);
    const tournament: Array<{ combination: Record<string, any>; score: number }> = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }
    
    tournament.sort((a, b) => b.score - a.score);
    return tournament[0];
  }

  /**
   * Crossover two parent combinations
   */
  private crossover(
    parent1: Record<string, any>,
    parent2: Record<string, any>
  ): Record<string, any> {
    const offspring: Record<string, any> = {};
    const keys = Array.from(new Set([...Object.keys(parent1), ...Object.keys(parent2)]));
    
    for (const key of keys) {
      if (Math.random() < 0.5) {
        offspring[key] = parent1[key] || parent2[key];
      } else {
        offspring[key] = parent2[key] || parent1[key];
      }
    }
    
    return offspring;
  }

  /**
   * Mutate a combination
   */
  private async mutate(
    combination: Record<string, any>,
    parameterTypes: string[]
  ): Promise<Record<string, any>> {
    const mutated = { ...combination };
    
    for (const parameterType of parameterTypes) {
      if (Math.random() < this.config.mutationRate) {
        const alternatives = await this.storage.getTopParametersByType(parameterType, 10);
        if (alternatives.length > 0) {
          const randomAlternative = alternatives[Math.floor(Math.random() * alternatives.length)];
          mutated[parameterType] = randomAlternative.parameterValue;
        }
      }
    }
    
    return mutated;
  }

  /**
   * Schedule automatic evolution cycles
   */
  async scheduleEvolutionCycle(
    parameterTypes: string[],
    intervalMs: number,
    callback?: (result: EvolutionResult) => void
  ): Promise<NodeJS.Timeout> {
    const runEvolution = async () => {
      try {
        const topCombinations = await this.storage.getTopCombinations(this.config.populationSize);
        const initialPopulation = topCombinations.map(c => c.combination);
        
        if (initialPopulation.length === 0) {
          return; // No data to evolve from
        }

        const result = await this.evolveConfigurations(initialPopulation, parameterTypes);
        
        if (callback) {
          callback(result);
        }
      } catch (error) {
        console.error('Evolution cycle failed:', error);
      }
    };

    await runEvolution();
    
    return setInterval(runEvolution, intervalMs);
  }
}

/**
 * Generate optimal configuration from current ratings
 */
export async function generateOptimalConfig(
  parameterTypes: string[],
  storage: StorageManager = new StorageManager()
): Promise<Record<string, any> | null> {
  const engine = new EvolutionEngine(storage);
  const optimal = await engine.generateOptimalConfigurations(parameterTypes, 1);
  
  return optimal.length > 0 ? optimal[0].combination : null;
}

/**
 * Evolve configurations using genetic algorithm
 */
export async function evolveConfigurations(
  initialPopulation: Array<Record<string, any>>,
  parameterTypes: string[],
  config?: Partial<EvolutionConfig>,
  storage: StorageManager = new StorageManager()
): Promise<EvolutionResult> {
  const evolutionConfig = { ...DEFAULT_EVOLUTION_CONFIG, ...config };
  const engine = new EvolutionEngine(storage, evolutionConfig);
  
  return engine.evolveConfigurations(initialPopulation, parameterTypes);
}
