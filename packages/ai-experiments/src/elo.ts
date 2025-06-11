/**
 * Elo rating system for tracking AI experiment parameter performance
 */

export interface EloRating {
  rating: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface ParameterRating {
  parameterType: string; // e.g., "model", "prompt", "temperature"
  parameterValue: any;
  rating: EloRating;
}

export interface CombinationRating {
  combination: Record<string, any>;
  rating: EloRating;
}

export interface MatchOutcome {
  winner?: 'A' | 'B';
  isDraw: boolean;
}

/**
 * Default Elo rating for new parameters/combinations
 */
export const DEFAULT_ELO_RATING = 1200;

/**
 * K-factor for Elo rating calculations (higher = more volatile ratings)
 */
export const ELO_K_FACTOR = 32;

/**
 * Create a new Elo rating with default values
 */
export function createEloRating(initialRating: number = DEFAULT_ELO_RATING): EloRating {
  return {
    rating: initialRating,
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  };
}

/**
 * Calculate expected score for player A against player B
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Update Elo ratings based on match outcome
 */
export function updateEloRatings(
  ratingA: EloRating,
  ratingB: EloRating,
  outcome: MatchOutcome,
  kFactor: number = ELO_K_FACTOR
): { updatedA: EloRating; updatedB: EloRating } {
  const expectedA = calculateExpectedScore(ratingA.rating, ratingB.rating);
  const expectedB = 1 - expectedA;

  let scoreA: number;
  let scoreB: number;

  if (outcome.isDraw) {
    scoreA = 0.5;
    scoreB = 0.5;
  } else if (outcome.winner === 'A') {
    scoreA = 1;
    scoreB = 0;
  } else {
    scoreA = 0;
    scoreB = 1;
  }

  const newRatingA = ratingA.rating + kFactor * (scoreA - expectedA);
  const newRatingB = ratingB.rating + kFactor * (scoreB - expectedB);

  const updatedA: EloRating = {
    rating: Math.round(newRatingA),
    matches: ratingA.matches + 1,
    wins: ratingA.wins + (scoreA === 1 ? 1 : 0),
    losses: ratingA.losses + (scoreA === 0 ? 1 : 0),
    draws: ratingA.draws + (scoreA === 0.5 ? 1 : 0),
  };

  const updatedB: EloRating = {
    rating: Math.round(newRatingB),
    matches: ratingB.matches + 1,
    wins: ratingB.wins + (scoreB === 1 ? 1 : 0),
    losses: ratingB.losses + (scoreB === 0 ? 1 : 0),
    draws: ratingB.draws + (scoreB === 0.5 ? 1 : 0),
  };

  return { updatedA, updatedB };
}

/**
 * Create a parameter rating entry
 */
export function createParameterRating(
  parameterType: string,
  parameterValue: any,
  initialRating?: number
): ParameterRating {
  return {
    parameterType,
    parameterValue,
    rating: createEloRating(initialRating),
  };
}

/**
 * Create a combination rating entry
 */
export function createCombinationRating(
  combination: Record<string, any>,
  initialRating?: number
): CombinationRating {
  return {
    combination,
    rating: createEloRating(initialRating),
  };
}

/**
 * Get the top-rated parameters by type
 */
export function getTopParametersByType(
  parameters: ParameterRating[],
  parameterType: string,
  limit: number = 5
): ParameterRating[] {
  return parameters
    .filter(p => p.parameterType === parameterType)
    .sort((a, b) => b.rating.rating - a.rating.rating)
    .slice(0, limit);
}

/**
 * Get the top-rated combinations
 */
export function getTopCombinations(
  combinations: CombinationRating[],
  limit: number = 5
): CombinationRating[] {
  return combinations
    .sort((a, b) => b.rating.rating - a.rating.rating)
    .slice(0, limit);
}
