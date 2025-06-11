export { cartesian } from './cartesian.js'
export { experiment, type ExperimentConfig, type ExperimentResult } from './experiment.js'

export {
  type EloRating,
  type ParameterRating,
  type CombinationRating,
  type MatchOutcome,
  DEFAULT_ELO_RATING,
  ELO_K_FACTOR,
  createEloRating,
  calculateExpectedScore,
  updateEloRatings,
  createParameterRating,
  createCombinationRating,
  getTopParametersByType,
  getTopCombinations
} from './elo.js'

export {
  type EvaluationCriteria,
  type EvaluatedResult,
  type ComparisonResult,
  evaluateResults,
  compareResults,
  evaluateExperimentBatch
} from './evaluation.js'

export {
  type ExperimentHistory,
  type RatingStorage,
  StorageManager,
  defaultStorage
} from './storage.js'

export {
  type EvolutionConfig,
  type OptimalConfiguration,
  type EvolutionResult,
  DEFAULT_EVOLUTION_CONFIG,
  EvolutionEngine,
  generateOptimalConfig,
  evolveConfigurations
} from './evolution.js'

export {
  type ConfigExportOptions,
  type DeploymentConfig,
  ConfigManager,
  exportConfiguration,
  scheduleEvolutionCycle
} from './config-manager.js'
