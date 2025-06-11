import { loadExperimentHistory } from './storage.js';
import { ParameterRating, CombinationRating } from './elo.js';

export interface EvolutionConfig {
  populationSize?: number;
  mutationRate?: number;
  crossoverRate?: number;
  eliteCount?: number;
}

export async function generateOptimalConfig(
  parameterTypes: string[]
): Promise<Record<string, any>> {
  const history = await loadExperimentHistory();
  const config: Record<string, any> = {};
  
  for (const paramType of parameterTypes) {
    const paramRatings = history.parameters.filter(p => p.parameterType === paramType);
    
    if (paramRatings.length > 0) {
      paramRatings.sort((a, b) => b.rating.rating - a.rating.rating);
      config[paramType] = paramRatings[0].parameterValue;
    }
  }
  
  return config;
}

export async function evolveConfigurations(
  baseConfig: Record<string, any[]>,
  evolutionConfig: EvolutionConfig = {}
): Promise<Array<Record<string, any>>> {
  const {
    populationSize = 10,
    mutationRate = 0.1,
    crossoverRate = 0.7,
    eliteCount = 2
  } = evolutionConfig;
  
  const history = await loadExperimentHistory();
  const population: Array<Record<string, any>> = [];
  
  const eliteCombinations = history.combinations
    .sort((a, b) => b.rating.rating - a.rating.rating)
    .slice(0, eliteCount)
    .map(c => c.combination);
  
  population.push(...eliteCombinations);
  
  while (population.length < populationSize) {
    if (Math.random() < crossoverRate && eliteCombinations.length >= 2) {
      const parent1 = eliteCombinations[Math.floor(Math.random() * eliteCombinations.length)];
      const parent2 = eliteCombinations[Math.floor(Math.random() * eliteCombinations.length)];
      const child = crossover(parent1, parent2, baseConfig);
      population.push(child);
    } else {
      if (eliteCombinations.length > 0 && Math.random() < 0.8) {
        const parent = eliteCombinations[Math.floor(Math.random() * eliteCombinations.length)];
        const mutated = mutate(parent, baseConfig, mutationRate);
        population.push(mutated);
      } else {
        const random = generateRandomCombination(baseConfig);
        population.push(random);
      }
    }
  }
  
  return population.slice(0, populationSize);
}

function crossover(
  parent1: Record<string, any>,
  parent2: Record<string, any>,
  baseConfig: Record<string, any[]>
): Record<string, any> {
  const child: Record<string, any> = {};
  
  for (const [key, values] of Object.entries(baseConfig)) {
    if (Math.random() < 0.5 && parent1[key] !== undefined) {
      child[key] = parent1[key];
    } else if (parent2[key] !== undefined) {
      child[key] = parent2[key];
    } else {
      child[key] = values[Math.floor(Math.random() * values.length)];
    }
  }
  
  return child;
}

function mutate(
  combination: Record<string, any>,
  baseConfig: Record<string, any[]>,
  mutationRate: number
): Record<string, any> {
  const mutated = { ...combination };
  
  for (const [key, values] of Object.entries(baseConfig)) {
    if (Math.random() < mutationRate) {
      mutated[key] = values[Math.floor(Math.random() * values.length)];
    }
  }
  
  return mutated;
}

function generateRandomCombination(baseConfig: Record<string, any[]>): Record<string, any> {
  const combination: Record<string, any> = {};
  
  for (const [key, values] of Object.entries(baseConfig)) {
    combination[key] = values[Math.floor(Math.random() * values.length)];
  }
  
  return combination;
}
