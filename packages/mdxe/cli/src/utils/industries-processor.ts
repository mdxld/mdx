import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

export interface IndustryData {
  code: string;
  title: string;
  description?: string;
}

export interface RemoteJobAssessment {
  job: string;
  feasibility: number;
  timeline: string;
  reasoning: string;
}

export async function loadIndustriesData(filePath: string): Promise<IndustryData[]> {
  const fileContent = await fs.promises.readFile(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    delimiter: '\t',
    skip_empty_lines: true
  });
  
  return records.map((record: any) => ({
    code: record.naics || record.code,
    title: record.industry || record.title,
    description: record.description || ''
  }));
}

export async function categorizeRemoteJobs(industry: IndustryData): Promise<string[]> {
  const { createExecutionContext } = await import('./execution-context');
  const context = await createExecutionContext('default');
  
  // Create a simple AI function without caching to avoid filename length issues
  const simpleAI = async (prompt: string) => {
    const { generateText } = await import('./execution-context');
    return await generateText({
      model: 'gpt-4o',
      prompt,
      middleware: [], // No caching
      functionName: 'simple-ai',
    });
  };
  
  const prompt = `List remote laptop-based jobs in the "${industry.title}" industry that could potentially be automated by AI. Focus on knowledge work, data processing, analysis, customer service, content creation, and similar roles that don't require physical presence. Return as a JSON array of job titles.`;
  
  try {
    const result = await simpleAI(prompt);
    const jobs = JSON.parse(result.text);
    if (Array.isArray(jobs)) {
      return jobs.filter(job => typeof job === 'string' && job.trim().length > 0);
    }
    return [];
  } catch (error) {
    console.error(`Error categorizing jobs for ${industry.title}:`, error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function assessAIFeasibility(jobs: string[], industry: IndustryData): Promise<RemoteJobAssessment[]> {
  const { generateText } = await import('./execution-context');
  
  const assessments: RemoteJobAssessment[] = [];
  
  for (const job of jobs) {
    const prompt = `Assess AI automation feasibility for "${job}" in ${industry.title}. Return JSON: {"feasibility": 0-100, "timeline": "immediate|1-2 years|3-5 years|5+ years", "reasoning": "brief explanation"}`;

    try {
      const result = await generateText({
        model: 'gpt-4o',
        prompt,
        middleware: [], // No caching to avoid filename length issues
        functionName: 'assess-job',
      });
      
      const parsed = JSON.parse(result.text);
      assessments.push({
        job,
        feasibility: parsed.feasibility || 0,
        timeline: parsed.timeline || '5+ years',
        reasoning: parsed.reasoning || 'Assessment unavailable'
      });
    } catch (error) {
      console.error(`Error assessing ${job}:`, error instanceof Error ? error.message : String(error));
      assessments.push({
        job,
        feasibility: 0,
        timeline: '5+ years',
        reasoning: 'Assessment failed - invalid response format'
      });
    }
  }
  
  return assessments;
}
