import * as path from 'path';
import { loadIndustriesData, categorizeRemoteJobs, assessAIFeasibility } from '../utils/industries-processor';
import { generateSaaSOpportunities, recursivelyExpandIdeas } from '../utils/saas-generator';
import { processIndustryIdeas } from '../utils/industry-ideas-handler';

export interface AnalyzeIndustriesOptions {
  file?: string;
  depth?: number;
  limit?: number;
  verbose?: boolean;
}

export async function runAnalyzeIndustriesCommand(options: AnalyzeIndustriesOptions = {}) {
  const {
    file = 'examples/industries/naics.tsv',
    depth = 2,
    limit = 10,
    verbose = false
  } = options;

  try {
    const filePath = path.resolve(process.cwd(), file);
    console.log(`🔍 Loading industries data from ${filePath}...`);
    
    const industries = await loadIndustriesData(filePath);
    console.log(`📊 Loaded ${industries.length} industries`);
    
    const industriesToProcess = industries.slice(0, limit);
    console.log(`🎯 Processing first ${industriesToProcess.length} industries (use --limit to change)`);
    
    const allOpportunities: any[] = [];
    
    for (const [index, industry] of industriesToProcess.entries()) {
      console.log(`\n[${index + 1}/${industriesToProcess.length}] Analyzing: ${industry.title}`);
      
      try {
        if (verbose) console.log('  🔍 Identifying remote jobs...');
        const remoteJobs = await categorizeRemoteJobs(industry);
        
        if (remoteJobs.length === 0) {
          console.log('  ⚠️  No remote jobs identified, skipping...');
          continue;
        }
        
        if (verbose) console.log(`  📋 Found ${remoteJobs.length} remote jobs`);
        
        if (verbose) console.log('  🤖 Assessing AI feasibility...');
        const assessments = await assessAIFeasibility(remoteJobs, industry);
        
        if (verbose) console.log('  💡 Generating SaaS opportunities...');
        const opportunities = await generateSaaSOpportunities(industry, assessments);
        
        if (opportunities.length === 0) {
          console.log('  ⚠️  No viable opportunities identified');
          continue;
        }
        
        if (verbose) console.log(`  🔄 Applying CTC expansion (depth: ${depth})...`);
        const expandedOpportunities = await recursivelyExpandIdeas(opportunities, depth);
        
        allOpportunities.push(...expandedOpportunities);
        console.log(`  ✅ Generated ${expandedOpportunities.length} opportunities`);
        
      } catch (error) {
        console.error(`  ❌ Error processing ${industry.title}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`\n🎉 Analysis complete! Generated ${allOpportunities.length} total opportunities`);
    
    if (allOpportunities.length > 0) {
      console.log('\n🚀 Processing opportunities through idea.captured event handler...');
      await processIndustryIdeas(allOpportunities);
    } else {
      console.log('⚠️  No opportunities to process');
    }
    
  } catch (error) {
    console.error('❌ Error in industry analysis:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
