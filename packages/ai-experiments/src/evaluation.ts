/**
 * Performance evaluation system for comparing experiment results
 */

export interface EvaluationCriteria {
  type: 'numeric' | 'boolean' | 'string' | 'custom';
  metric?: string; // For extracting specific metrics from results
  higherIsBetter?: boolean; // For numeric comparisons
  customComparator?: (a: any, b: any) => 'A' | 'B' | 'draw';
  errorPenalty?: number; // Penalty for errors (0-1, where 1 means error = automatic loss)
}

export interface EvaluatedResult {
  combination: Record<string, any>;
  result: any;
  error?: string;
  score?: number;
  rank?: number;
}

export interface ComparisonResult {
  winner?: 'A' | 'B';
  isDraw: boolean;
  confidence: number; // 0-1, how confident we are in the comparison
  reason?: string;
}

/**
 * Evaluate experiment results based on criteria
 */
export function evaluateResults(
  results: Array<{
    combination: Record<string, any>;
    result: any;
    error?: string;
  }>,
  criteria: EvaluationCriteria
): EvaluatedResult[] {
  const evaluatedResults: EvaluatedResult[] = results.map(result => ({
    ...result,
    score: calculateScore(result, criteria),
  }));

  evaluatedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
  evaluatedResults.forEach((result, index) => {
    result.rank = index + 1;
  });

  return evaluatedResults;
}

/**
 * Calculate score for a single result based on criteria
 */
function calculateScore(
  result: {
    combination: Record<string, any>;
    result: any;
    error?: string;
  },
  criteria: EvaluationCriteria
): number {
  if (result.error) {
    const penalty = criteria.errorPenalty || 0.8;
    return (1 - penalty) * 100; // Base score reduced by penalty
  }

  switch (criteria.type) {
    case 'numeric':
      return calculateNumericScore(result.result, criteria);
    case 'boolean':
      return calculateBooleanScore(result.result, criteria);
    case 'string':
      return calculateStringScore(result.result, criteria);
    case 'custom':
      return calculateCustomScore(result.result, criteria);
    default:
      return 50; // Neutral score
  }
}

/**
 * Calculate score for numeric results
 */
function calculateNumericScore(result: any, criteria: EvaluationCriteria): number {
  let value: number;

  if (criteria.metric) {
    value = extractMetric(result, criteria.metric);
  } else if (typeof result === 'number') {
    value = result;
  } else {
    return 50; // Neutral score if can't extract numeric value
  }

  if (isNaN(value)) {
    return 0; // Invalid numeric value
  }

  return Math.max(0, Math.min(100, value));
}

/**
 * Calculate score for boolean results
 */
function calculateBooleanScore(result: any, criteria: EvaluationCriteria): number {
  let value: boolean;

  if (criteria.metric) {
    value = extractMetric(result, criteria.metric);
  } else if (typeof result === 'boolean') {
    value = result;
  } else {
    return 50; // Neutral score
  }

  const isPositive = criteria.higherIsBetter !== false; // Default to true
  return (value === isPositive) ? 100 : 0;
}

/**
 * Calculate score for string results
 */
function calculateStringScore(result: any, criteria: EvaluationCriteria): number {
  let value: string;

  if (criteria.metric) {
    value = extractMetric(result, criteria.metric);
  } else if (typeof result === 'string') {
    value = result;
  } else {
    return 50; // Neutral score
  }

  const length = value.length;
  const isLongerBetter = criteria.higherIsBetter !== false;
  
  const normalizedLength = Math.min(100, Math.max(10, length / 2));
  return isLongerBetter ? normalizedLength : 100 - normalizedLength;
}

/**
 * Calculate score using custom criteria
 */
function calculateCustomScore(result: any, criteria: EvaluationCriteria): number {
  return 50;
}

/**
 * Extract a metric from a result object using dot notation
 */
function extractMetric(result: any, metric: string): any {
  const parts = metric.split('.');
  let value = result;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Compare two results and determine winner
 */
export function compareResults(
  resultA: EvaluatedResult,
  resultB: EvaluatedResult,
  criteria: EvaluationCriteria
): ComparisonResult {
  const aHasError = !!resultA.error;
  const bHasError = !!resultB.error;

  if (aHasError && bHasError) {
    return { isDraw: true, confidence: 0.8, reason: 'Both results have errors' };
  }
  if (aHasError) {
    return { winner: 'B', isDraw: false, confidence: 0.9, reason: 'Result A has error' };
  }
  if (bHasError) {
    return { winner: 'A', isDraw: false, confidence: 0.9, reason: 'Result B has error' };
  }

  if (criteria.customComparator) {
    const customResult = criteria.customComparator(resultA.result, resultB.result);
    return {
      winner: customResult === 'draw' ? undefined : customResult,
      isDraw: customResult === 'draw',
      confidence: 0.7, // Custom comparators might be less reliable
      reason: 'Custom comparator result',
    };
  }

  const scoreA = resultA.score || 0;
  const scoreB = resultB.score || 0;
  const scoreDiff = Math.abs(scoreA - scoreB);

  const confidence = Math.min(0.95, 0.5 + (scoreDiff / 100));

  if (scoreDiff < 1) {
    return { isDraw: true, confidence, reason: 'Scores are too close' };
  }

  return {
    winner: scoreA > scoreB ? 'A' : 'B',
    isDraw: false,
    confidence,
    reason: `Score difference: ${scoreDiff.toFixed(2)}`,
  };
}

/**
 * Evaluate a batch of results and generate all pairwise comparisons
 */
export function evaluateExperimentBatch(
  results: Array<{
    combination: Record<string, any>;
    result: any;
    error?: string;
  }>,
  criteria: EvaluationCriteria
): {
  evaluatedResults: EvaluatedResult[];
  comparisons: Array<{
    indexA: number;
    indexB: number;
    comparison: ComparisonResult;
  }>;
} {
  const evaluatedResults = evaluateResults(results, criteria);
  const comparisons: Array<{
    indexA: number;
    indexB: number;
    comparison: ComparisonResult;
  }> = [];

  for (let i = 0; i < evaluatedResults.length; i++) {
    for (let j = i + 1; j < evaluatedResults.length; j++) {
      const comparison = compareResults(evaluatedResults[i], evaluatedResults[j], criteria);
      comparisons.push({
        indexA: i,
        indexB: j,
        comparison,
      });
    }
  }

  return { evaluatedResults, comparisons };
}
