import { SaaSOpportunity } from './saas-generator';

export async function processIndustryIdeas(opportunities: SaaSOpportunity[]): Promise<void> {
  const { createExecutionContext } = await import('./execution-context');
  
  console.log(`Processing ${opportunities.length} Services-as-Software opportunities through idea.captured event handler...`);
  
  const context = await createExecutionContext('default');
  
  for (const opportunity of opportunities) {
    const ideaDescription = `${opportunity.aiReplacement} - ${opportunity.businessModel}

Industry: ${opportunity.industry}
Target Job: ${opportunity.job}
AI Feasibility: ${opportunity.feasibility}%
Timeline: ${opportunity.timeline}
CTC Iteration: ${opportunity.ctcIteration}

Reasoning: ${opportunity.reasoning}`;

    try {
      console.log(`Processing idea: ${opportunity.job} automation in ${opportunity.industry}`);
      
      await context.send('idea.captured', ideaDescription);
      
    } catch (error) {
      console.error(`Error processing idea for ${opportunity.job}:`, error);
    }
  }
  
  console.log('✅ All opportunities processed through idea.captured event handler');
}
