import { IndustryData, RemoteJobAssessment } from './industries-processor';

export interface SaaSOpportunity {
  industry: string;
  job: string;
  aiReplacement: string;
  businessModel: string;
  feasibility: number;
  timeline: string;
  reasoning: string;
  ctcIteration: number;
}

export async function generateSaaSOpportunities(
  industry: IndustryData,
  assessments: RemoteJobAssessment[]
): Promise<SaaSOpportunity[]> {
  const { generateText } = await import('./execution-context');
  
  const opportunities: SaaSOpportunity[] = [];
  
  const viableJobs = assessments.filter(assessment => assessment.feasibility > 60);
  
  for (const assessment of viableJobs) {
    const prompt = `Generate SaaS opportunity for automating "${assessment.job}" in ${industry.title}. Return JSON: {"aiReplacement": "AI solution", "businessModel": "SaaS model", "reasoning": "why viable"}`;

    try {
      const result = await generateText({
        model: 'gpt-4o',
        prompt,
        middleware: [], // No caching to avoid filename length issues
        functionName: 'generate-saas',
      });
      
      const parsed = JSON.parse(result.text);
      
      opportunities.push({
        industry: industry.title,
        job: assessment.job,
        aiReplacement: parsed.aiReplacement || 'AI automation solution',
        businessModel: parsed.businessModel || 'SaaS subscription model',
        feasibility: assessment.feasibility,
        timeline: assessment.timeline,
        reasoning: parsed.reasoning || 'Business opportunity identified',
        ctcIteration: 0
      });
    } catch (error) {
      console.error(`Error generating opportunity for ${assessment.job}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  return opportunities;
}

export async function applyCTC(opportunity: SaaSOpportunity): Promise<SaaSOpportunity[]> {
  const { generateText } = await import('./execution-context');
  
  const prompt = `Apply CTC to expand "${opportunity.job}" automation in ${opportunity.industry}. Return JSON array of 2-3 opportunities: [{"aiReplacement": "solution", "businessModel": "model", "reasoning": "CTC applied", "industry": "name", "job": "title"}]`;

  try {
    const result = await generateText({
      model: 'gpt-4o',
      prompt,
      middleware: [], // No caching to avoid filename length issues
      functionName: 'apply-ctc',
    });
    
    const parsed = JSON.parse(result.text);
    
    if (!Array.isArray(parsed)) {
      console.error(`CTC response not an array for ${opportunity.job}`);
      return [opportunity];
    }
    
    return parsed.map((expanded: any) => ({
      ...opportunity,
      aiReplacement: expanded.aiReplacement || opportunity.aiReplacement,
      businessModel: expanded.businessModel || opportunity.businessModel,
      reasoning: expanded.reasoning || 'CTC expansion applied',
      industry: expanded.industry || opportunity.industry,
      job: expanded.job || opportunity.job,
      ctcIteration: opportunity.ctcIteration + 1
    }));
  } catch (error) {
    console.error(`Error applying CTC to ${opportunity.job}:`, error instanceof Error ? error.message : String(error));
    return [opportunity];
  }
}

export async function recursivelyExpandIdeas(
  opportunities: SaaSOpportunity[],
  depth: number = 2
): Promise<SaaSOpportunity[]> {
  if (depth <= 0) return opportunities;
  
  const expandedOpportunities: SaaSOpportunity[] = [...opportunities];
  
  for (const opportunity of opportunities) {
    if (opportunity.ctcIteration < depth) {
      const expanded = await applyCTC(opportunity);
      expandedOpportunities.push(...expanded);
    }
  }
  
  const newOpportunities = expandedOpportunities.filter(opp => opp.ctcIteration === opportunities[0]?.ctcIteration + 1 || 0);
  if (newOpportunities.length > 0) {
    const furtherExpanded = await recursivelyExpandIdeas(newOpportunities, depth - 1);
    expandedOpportunities.push(...furtherExpanded);
  }
  
  return expandedOpportunities;
}
