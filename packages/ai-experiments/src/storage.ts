import { promises as fs } from 'fs';
import path from 'path';
import { ParameterRating, CombinationRating, calculateEloUpdate } from './elo.js';

export interface ExperimentHistory {
  parameters: ParameterRating[];
  combinations: CombinationRating[];
  experiments: Array<{
    timestamp: number;
    description: string;
    results: any[];
    evaluations: any[];
  }>;
}

const STORAGE_DIR = process.env.NODE_ENV === 'test' ? '.ai-experiments-test' : '.ai-experiments';
const HISTORY_FILE = 'experiment-history.json';

export async function ensureStorageDir(): Promise<string> {
  const storageDir = path.join(process.cwd(), STORAGE_DIR);
  await fs.mkdir(storageDir, { recursive: true });
  return storageDir;
}

export async function loadExperimentHistory(): Promise<ExperimentHistory> {
  try {
    const storageDir = await ensureStorageDir();
    const historyPath = path.join(storageDir, HISTORY_FILE);
    const data = await fs.readFile(historyPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      parameters: [],
      combinations: [],
      experiments: []
    };
  }
}

export async function saveExperimentHistory(history: ExperimentHistory): Promise<void> {
  const storageDir = await ensureStorageDir();
  const historyPath = path.join(storageDir, HISTORY_FILE);
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
}

export async function updateRatings(
  experimentResults: any[],
  evaluations: any[],
  description: string
): Promise<{ parameters: ParameterRating[]; combinations: CombinationRating[] }> {
  const history = await loadExperimentHistory();
  
  const parameterMap = new Map<string, ParameterRating>();
  history.parameters.forEach(p => {
    parameterMap.set(`${p.parameterType}:${JSON.stringify(p.parameterValue)}`, p);
  });
  
  const combinationMap = new Map<string, CombinationRating>();
  history.combinations.forEach(c => {
    combinationMap.set(JSON.stringify(c.combination), c);
  });
  
  for (const evaluation of evaluations) {
    const winnerResult = experimentResults[evaluation.winner];
    const loserResult = experimentResults[evaluation.loser];
    
    updateCombinationRating(combinationMap, winnerResult.combination, 'win');
    updateCombinationRating(combinationMap, loserResult.combination, 'loss');
    
    updateParameterRatings(parameterMap, winnerResult.combination, loserResult.combination, evaluation.outcome);
  }
  
  const updatedParameters = Array.from(parameterMap.values());
  const updatedCombinations = Array.from(combinationMap.values());
  
  history.parameters = updatedParameters;
  history.combinations = updatedCombinations;
  history.experiments.push({
    timestamp: Date.now(),
    description,
    results: experimentResults,
    evaluations
  });
  
  await saveExperimentHistory(history);
  
  return {
    parameters: updatedParameters,
    combinations: updatedCombinations
  };
}

function updateCombinationRating(
  combinationMap: Map<string, CombinationRating>,
  combination: Record<string, any>,
  outcome: 'win' | 'loss'
): void {
  const key = JSON.stringify(combination);
  let rating = combinationMap.get(key);
  
  if (!rating) {
    rating = {
      combination,
      rating: { rating: 1200, matches: 0, wins: 0, losses: 0, draws: 0 }
    };
    combinationMap.set(key, rating);
  }
  
  rating.rating.matches++;
  if (outcome === 'win') {
    rating.rating.wins++;
  } else {
    rating.rating.losses++;
  }
}

function updateParameterRatings(
  parameterMap: Map<string, ParameterRating>,
  winnerCombination: Record<string, any>,
  loserCombination: Record<string, any>,
  outcome: 'win' | 'loss' | 'draw'
): void {
  for (const [paramType, winnerValue] of Object.entries(winnerCombination)) {
    const loserValue = loserCombination[paramType];
    
    if (winnerValue !== loserValue) {
      updateParameterRating(parameterMap, paramType, winnerValue, outcome === 'win' ? 'win' : 'loss');
      updateParameterRating(parameterMap, paramType, loserValue, outcome === 'win' ? 'loss' : 'win');
    }
  }
}

function updateParameterRating(
  parameterMap: Map<string, ParameterRating>,
  parameterType: string,
  parameterValue: any,
  outcome: 'win' | 'loss'
): void {
  const key = `${parameterType}:${JSON.stringify(parameterValue)}`;
  let rating = parameterMap.get(key);
  
  if (!rating) {
    rating = {
      parameterType,
      parameterValue,
      rating: { rating: 1200, matches: 0, wins: 0, losses: 0, draws: 0 }
    };
    parameterMap.set(key, rating);
  }
  
  rating.rating.matches++;
  if (outcome === 'win') {
    rating.rating.wins++;
  } else {
    rating.rating.losses++;
  }
}
