# Services-as-Software Generator

This system automates the identification of Services-as-Software opportunities from occupation data and recursively generates AI Business-as-Code startup ideas using the Copy-Transform-Combine methodology.

## Overview

The Services-as-Software generator extends the existing MDX ecosystem to:

1. **Copy**: Analyze existing occupations that can be performed remotely
2. **Transform**: Identify automation potential and create service blueprints  
3. **Combine**: Generate business models and feed them back into the idea pipeline

## Architecture

### Core Components

- **AI Functions**: `occupationAnalysis`, `serviceBlueprint`, `businessModelCanvas`
- **Event System**: `occupation.analyzed` event handler with recursive feedback
- **Data Processing**: TSV parser for occupation data
- **Output Generation**: JSON files with complete business ideas

### Data Flow

```
Occupation Data (TSV) → Analysis → Service Blueprint → Business Model → Idea Generation → Recursive Feedback
```

## Data Structure

Occupation data is stored in TSV format at `data/occupations/remote-occupations.tsv`:

| Column | Description | Example |
|--------|-------------|---------|
| Occupation Name | Job title | "Content Writer" |
| Category | Job category | "Content Creation" |
| Automation Score | 1-10 scale | 8 |
| Key Tasks | Comma-separated | "Research,Write,Edit" |
| Required Tools | Comma-separated | "Word processors,SEO tools" |

## Usage

### Basic Usage

```bash
# Analyze occupations and generate services
pnpm run analyze-occupations

# Alternative command
pnpm run generate-services
```

### Programmatic Usage

```typescript
import { processOccupations } from './packages/mdxe/cli/src/utils/occupation-processor'

// Process all occupations
const result = await processOccupations()
console.log(`Processed ${result.results.length} occupations`)
```

### Event-Driven Usage

```typescript
import { on, emit, MutableEventContext } from './packages/mdxe/cli/src/utils/event-system'

// Register handler for generated ideas
on('idea.captured', (idea, context) => {
  console.log(`New idea generated: ${idea.name}`)
  // Further processing...
})

// Trigger occupation analysis
emit('occupation.analyzed', {}, new MutableEventContext({
  eventType: 'occupation.analyzed',
  timestamp: new Date().toISOString()
}))
```

## Output

Generated ideas are saved to `output/services-as-software/` as JSON files containing:

```json
{
  "name": "Content-Writer-as-a-Service",
  "description": "Automated content creation service",
  "occupation": "Content Writer",
  "category": "Content Creation", 
  "automationScore": 8,
  "blueprint": {
    "serviceName": "ContentBot Pro",
    "summary": "AI-powered content creation platform",
    "coreFeatures": ["Topic research", "Content generation", "SEO optimization"],
    "targetMarket": "Small businesses and marketing agencies",
    "valueProposition": "10x faster content creation with consistent quality",
    "technicalApproach": "LLM-based content generation with human oversight",
    "pricingModel": "Subscription-based with usage tiers"
  },
  "businessModel": {
    "keyPartners": ["Content platforms", "SEO tool providers"],
    "keyActivities": ["AI model training", "Content generation", "Quality assurance"],
    "keyResources": ["AI models", "Content databases", "Technical team"],
    "valuePropositions": ["Speed", "Consistency", "Cost reduction"],
    "customerRelationships": ["Self-service platform", "Customer support"],
    "channels": ["Direct sales", "Partner integrations"],
    "customerSegments": ["SMBs", "Marketing agencies", "Content creators"],
    "costStructure": ["AI infrastructure", "Development", "Customer acquisition"],
    "revenueStreams": ["Subscription fees", "Usage-based pricing", "Premium features"]
  },
  "generatedAt": "2025-01-11T01:44:42.000Z"
}
```

## Recursive Processing

The system implements a recursive feedback loop:

1. Occupation data triggers `occupation.analyzed` event
2. High-potential occupations (score > 6) generate service blueprints
3. Service blueprints create business models
4. Business models trigger `idea.captured` events
5. Generated ideas can be further refined and combined

## Configuration

### Automation Threshold

Only occupations with automation scores > 6 generate service blueprints. Modify this in the event handler:

```typescript
if (analysis.automationPotential && analysis.automationPotential > 6) {
  // Generate service blueprint
}
```

### Output Directory

Change the output directory by modifying:

```typescript
const outputDir = path.resolve('output/services-as-software')
```

## Integration with Existing Systems

The Services-as-Software generator integrates seamlessly with:

- **MDXAI**: Uses existing AI template functions
- **MDXE**: Leverages the event system and execution context
- **MDXDB**: Can store generated ideas as structured data
- **MDXLD**: Supports linked data formats for business models

## Examples

See the generated ideas in `output/services-as-software/` for examples of:
- Content creation automation
- Administrative task services  
- Design and marketing tools
- Analysis and reporting platforms
- Customer support solutions

## Contributing

To add new occupation data:

1. Edit `data/occupations/remote-occupations.tsv`
2. Follow the TSV format with tab-separated values
3. Run `pnpm run analyze-occupations` to process new data

To extend the AI functions:

1. Add new functions to the `aiTemplateFunction` object in `execution-context.ts`
2. Follow the existing pattern with `generateText`, caching, and error handling
3. Update the event handlers to use new functions

## Troubleshooting

### Common Issues

- **File not found**: Ensure `data/occupations/remote-occupations.tsv` exists
- **Parse errors**: Check TSV format and tab separation
- **AI errors**: Verify AI functions are properly configured
- **Permission errors**: Ensure write access to `output/` directory

### Debug Mode

Enable debug logging:

```bash
DEBUG=1 pnpm run analyze-occupations
```

### Manual Testing

Test individual components:

```typescript
// Test occupation analysis
const analysis = await ai.occupationAnalysis({
  name: "Content Writer",
  category: "Content Creation",
  automationScore: 8
})

// Test service blueprint
const blueprint = await ai.serviceBlueprint({ occupation, analysis })

// Test business model
const businessModel = await ai.businessModelCanvas({ occupation, blueprint })
```
