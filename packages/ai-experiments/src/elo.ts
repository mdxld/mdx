export interface EloRating {
  rating: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface ParameterRating {
  parameterType: string;
  parameterValue: any;
  rating: EloRating;
}

export interface CombinationRating {
  combination: Record<string, any>;
  rating: EloRating;
}

const DEFAULT_RATING = 1200;
const K_FACTOR = 32;

export function createEloRating(): EloRating {
  return {
    rating: DEFAULT_RATING,
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0
  };
}

export function calculateEloUpdate(
  winnerRating: number,
  loserRating: number,
  outcome: 'win' | 'loss' | 'draw' = 'win'
): { winnerNewRating: number; loserNewRating: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
  
  const actualWinner = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
  const actualLoser = outcome === 'loss' ? 1 : outcome === 'draw' ? 0.5 : 0;
  
  const winnerNewRating = winnerRating + K_FACTOR * (actualWinner - expectedWinner);
  const loserNewRating = loserRating + K_FACTOR * (actualLoser - expectedLoser);
  
  return { winnerNewRating, loserNewRating };
}
