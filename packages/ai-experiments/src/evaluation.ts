export interface EvaluationCriteria {
  type: 'ai' | 'numeric' | 'custom';
  prompt?: string;
  metric?: string;
  compareFn?: (resultA: any, resultB: any) => 'win' | 'loss' | 'draw';
  model?: string;
}

export interface EvaluationResult {
  winner: number;
  loser: number;
  outcome: 'win' | 'loss' | 'draw';
  confidence?: number;
  reasoning?: string;
}

export async function evaluateResults(
  results: Array<{ combination: Record<string, any>; result: any; error?: string }>,
  criteria: EvaluationCriteria
): Promise<EvaluationResult[]> {
  const evaluations: EvaluationResult[] = [];
  
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const resultA = results[i];
      const resultB = results[j];
      
      if (resultA.error || resultB.error) continue;
      
      let outcome: 'win' | 'loss' | 'draw';
      let confidence = 1.0;
      let reasoning = '';
      
      switch (criteria.type) {
        case 'numeric':
          outcome = evaluateNumeric(resultA.result, resultB.result, criteria.metric!);
          break;
        case 'custom':
          outcome = criteria.compareFn!(resultA.result, resultB.result);
          break;
        case 'ai':
          const aiResult = await evaluateWithAI(resultA.result, resultB.result, criteria);
          outcome = aiResult.outcome;
          confidence = aiResult.confidence || 1.0;
          reasoning = aiResult.reasoning || '';
          break;
        default:
          throw new Error(`Unknown evaluation type: ${criteria.type}`);
      }
      
      evaluations.push({
        winner: outcome === 'win' ? i : j,
        loser: outcome === 'win' ? j : i,
        outcome,
        confidence,
        reasoning
      });
    }
  }
  
  return evaluations;
}

function evaluateNumeric(resultA: any, resultB: any, metric: string): 'win' | 'loss' | 'draw' {
  const valueA = extractNumericValue(resultA, metric);
  const valueB = extractNumericValue(resultB, metric);
  
  if (valueA > valueB) return 'win';
  if (valueA < valueB) return 'loss';
  return 'draw';
}

function extractNumericValue(result: any, metric: string): number {
  switch (metric) {
    case 'length':
      return typeof result === 'string' ? result.length : 0;
    case 'speed':
      return result.executionTime || 0;
    default:
      return result[metric] || 0;
  }
}

async function evaluateWithAI(resultA: any, resultB: any, criteria: EvaluationCriteria) {
  try {
    const { ai } = await import('../../mdxai/src/index.js');
    
    const prompt = criteria.prompt || 'Which result is better? Respond with "A", "B", or "DRAW" and explain why.';
    const resultAStr = JSON.stringify(resultA);
    const resultBStr = JSON.stringify(resultB);
    
    const response = await ai`${prompt}

Result A: ${resultAStr}
Result B: ${resultBStr}

Respond in JSON format: {"choice": "A|B|DRAW", "confidence": 0.0-1.0, "reasoning": "explanation"}`;
    
    const parsed = JSON.parse(response);
    
    return {
      outcome: parsed.choice === 'A' ? 'win' as const : parsed.choice === 'B' ? 'loss' as const : 'draw' as const,
      confidence: parsed.confidence || 1.0,
      reasoning: parsed.reasoning || ''
    };
  } catch (error) {
    console.warn('AI evaluation failed, falling back to draw:', error);
    return { outcome: 'draw' as const, confidence: 0.5, reasoning: 'AI evaluation failed' };
  }
}
