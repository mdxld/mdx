import { promises as fs } from 'fs';
import path from 'path';
import { generateOptimalConfig } from './evolution.js';
import { loadExperimentHistory } from './storage.js';

export async function exportOptimalConfiguration(
  parameterTypes: string[],
  outputPath: string = './optimal-config.json'
): Promise<void> {
  const optimalConfig = await generateOptimalConfig(parameterTypes);
  const history = await loadExperimentHistory();
  
  const exportData = {
    config: optimalConfig,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalExperiments: history.experiments.length,
      parameterTypes,
      confidence: calculateConfigConfidence(optimalConfig, history.parameters)
    }
  };
  
  await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
  console.log(`Optimal configuration exported to ${outputPath}`);
}

export async function generateConfigurationReport(): Promise<string> {
  const history = await loadExperimentHistory();
  
  let report = '# AI Experiments Configuration Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Total Experiments: ${history.experiments.length}\n\n`;
  
  report += '## Parameter Rankings\n\n';
  const parametersByType = groupParametersByType(history.parameters);
  
  for (const [paramType, params] of Object.entries(parametersByType)) {
    report += `### ${paramType}\n\n`;
    params.sort((a, b) => b.rating.rating - a.rating.rating);
    
    for (const param of params.slice(0, 5)) {
      const winRate = param.rating.matches > 0 ? (param.rating.wins / param.rating.matches * 100).toFixed(1) : '0.0';
      report += `- **${JSON.stringify(param.parameterValue)}**: Rating ${param.rating.rating.toFixed(0)}, Win Rate ${winRate}% (${param.rating.matches} matches)\n`;
    }
    report += '\n';
  }
  
  report += '## Top Combinations\n\n';
  const topCombinations = history.combinations
    .sort((a, b) => b.rating.rating - a.rating.rating)
    .slice(0, 10);
  
  for (const combo of topCombinations) {
    const winRate = combo.rating.matches > 0 ? (combo.rating.wins / combo.rating.matches * 100).toFixed(1) : '0.0';
    report += `- Rating ${combo.rating.rating.toFixed(0)}, Win Rate ${winRate}%: ${JSON.stringify(combo.combination)}\n`;
  }
  
  return report;
}

function calculateConfigConfidence(
  config: Record<string, any>,
  parameters: any[]
): number {
  let totalConfidence = 0;
  let paramCount = 0;
  
  for (const [paramType, value] of Object.entries(config)) {
    const param = parameters.find(p => 
      p.parameterType === paramType && 
      JSON.stringify(p.parameterValue) === JSON.stringify(value)
    );
    
    if (param && param.rating.matches > 0) {
      const confidence = Math.min(param.rating.matches / 10, 1.0);
      totalConfidence += confidence;
    }
    paramCount++;
  }
  
  return paramCount > 0 ? totalConfidence / paramCount : 0;
}

function groupParametersByType(parameters: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  
  for (const param of parameters) {
    if (!grouped[param.parameterType]) {
      grouped[param.parameterType] = [];
    }
    grouped[param.parameterType].push(param);
  }
  
  return grouped;
}
