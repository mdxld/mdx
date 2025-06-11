import { createExecutionContext } from '../utils/execution-context'
import * as fs from 'fs'
import * as path from 'path'

interface OccupationData {
  occupation: string
  description: string
  remoteFeasibility: string
  aiAutomationPotential: string
  keyTasks: string
  requiredSkills: string
}

interface ServiceIdea {
  level: number
  occupation: string
  serviceType: string
  description: string
  aiCapabilities: string[]
  targetMarket: string
  valueProposition: string
}

interface AgentRoles {
  executive: {
    ceo: string
    coo: string
    cto: string
    cmo: string
  }
  specialized: {
    primaryAgent: string
    supportAgents: string[]
  }
  meta: {
    orchestrator: string
    qualityAssurance: string
    customerSuccess: string
  }
}

function parseOccupationsTSV(): OccupationData[] {
  const __filename = new URL(import.meta.url).pathname
  const __dirname = path.dirname(__filename)
  const tsvPath = path.join(__dirname, '../data/occupations.tsv')
  const tsvContent = fs.readFileSync(tsvPath, 'utf-8')
  const lines = tsvContent.trim().split('\n')
  const headers = lines[0].split('\t')
  
  return lines.slice(1).map(line => {
    const values = line.split('\t')
    return {
      occupation: values[0] || '',
      description: values[1] || '',
      remoteFeasibility: values[2] || '',
      aiAutomationPotential: values[3] || '',
      keyTasks: values[4] || '',
      requiredSkills: values[5] || ''
    }
  })
}

async function expandServiceIdea(occupation: OccupationData, level: number = 1, maxLevel: number = 3): Promise<ServiceIdea[]> {
  const ideas: ServiceIdea[] = []
  
  if (level === 1) {
    ideas.push({
      level: 1,
      occupation: occupation.occupation,
      serviceType: 'Direct Service Replacement',
      description: `AI-powered automation of ${occupation.occupation} tasks including ${occupation.keyTasks}`,
      aiCapabilities: ['Natural Language Processing', 'Task Automation', 'Data Processing'],
      targetMarket: 'Small to medium businesses seeking to automate routine tasks',
      valueProposition: `Replace human ${occupation.occupation} with 24/7 AI service at fraction of cost`
    })
  }
  
  if (level === 2) {
    ideas.push({
      level: 2,
      occupation: occupation.occupation,
      serviceType: 'Service Enhancement',
      description: `Enhanced AI ${occupation.occupation} with advanced capabilities beyond human limitations`,
      aiCapabilities: ['Advanced Analytics', 'Predictive Modeling', 'Multi-language Support', 'Real-time Processing'],
      targetMarket: 'Enterprise clients requiring sophisticated automation solutions',
      valueProposition: `Superior performance with AI capabilities that exceed human limitations`
    })
  }
  
  if (level === 3) {
    ideas.push({
      level: 3,
      occupation: occupation.occupation,
      serviceType: 'Service Ecosystem',
      description: `Comprehensive AI ecosystem integrating ${occupation.occupation} with related business functions`,
      aiCapabilities: ['Multi-agent Coordination', 'Cross-functional Integration', 'Adaptive Learning', 'Business Intelligence'],
      targetMarket: 'Large enterprises seeking complete digital transformation',
      valueProposition: `Complete business process automation with integrated AI workforce`
    })
  }
  
  if (level < maxLevel) {
    const nextLevelIdeas = await expandServiceIdea(occupation, level + 1, maxLevel)
    ideas.push(...nextLevelIdeas)
  }
  
  return ideas
}

async function defineAgentRoles(serviceIdea: ServiceIdea): Promise<AgentRoles> {
  return {
    executive: {
      ceo: `Chief Executive Agent responsible for strategic decisions and business growth for ${serviceIdea.serviceType}`,
      coo: `Chief Operations Agent managing day-to-day operations and service delivery optimization`,
      cto: `Chief Technology Agent overseeing AI infrastructure and technical capabilities`,
      cmo: `Chief Marketing Agent handling customer acquisition and brand positioning`
    },
    specialized: {
      primaryAgent: `Primary ${serviceIdea.occupation} AI Agent performing core service functions`,
      supportAgents: [
        `Quality Assurance Agent for service validation`,
        `Customer Interface Agent for client communication`,
        `Data Processing Agent for information management`
      ]
    },
    meta: {
      orchestrator: `Meta-orchestrator managing agent coordination and workflow optimization`,
      qualityAssurance: `Quality meta-agent ensuring service standards and continuous improvement`,
      customerSuccess: `Customer success meta-agent monitoring satisfaction and retention`
    }
  }
}

export async function generateServicesAsSoftware() {
  const context = await createExecutionContext()
  const occupations = parseOccupationsTSV()
  
  context.on('idea.captured', async (idea, eventContext) => {
    console.log(`Processing idea: ${idea}`)
    
    const relevantOccupations = occupations.filter(occupation => 
      occupation.remoteFeasibility === 'High' && 
      (occupation.aiAutomationPotential === 'High' || occupation.aiAutomationPotential === 'Medium') &&
      (occupation.occupation.toLowerCase().includes(idea.toLowerCase()) ||
       occupation.description.toLowerCase().includes(idea.toLowerCase()) ||
       occupation.keyTasks.toLowerCase().includes(idea.toLowerCase()))
    )
    
    if (relevantOccupations.length === 0) {
      console.log('No relevant occupations found, using all high-feasibility occupations')
      relevantOccupations.push(...occupations.filter(occ => occ.remoteFeasibility === 'High').slice(0, 5))
    }
    
    let totalConcepts = 0
    
    for (const occupation of relevantOccupations) {
      console.log(`\nProcessing occupation: ${occupation.occupation}`)
      
      const expandedIdeas = await expandServiceIdea(occupation)
      
      for (const serviceIdea of expandedIdeas) {
        console.log(`  Generating business model for Level ${serviceIdea.level}: ${serviceIdea.serviceType}`)
        
        const agentRoles = await defineAgentRoles(serviceIdea)
        
        const aiProxy = context.ai as any
        
        const leanCanvasPrompt = `Generate a lean canvas for ${serviceIdea.description}. Occupation: ${occupation.occupation}, Level: ${serviceIdea.level}, Service Type: ${serviceIdea.serviceType}, Target Market: ${serviceIdea.targetMarket}, Value Proposition: ${serviceIdea.valueProposition}, AI Capabilities: ${serviceIdea.aiCapabilities.join(', ')}`
        const leanCanvas = await aiProxy.leanCanvas(leanCanvasPrompt)
        
        const storyBrandPrompt = `Generate a StoryBrand framework for ${serviceIdea.description}. Occupation: ${occupation.occupation}, Target Market: ${serviceIdea.targetMarket}, Value Proposition: ${serviceIdea.valueProposition}`
        const storyBrand = await aiProxy.storyBrand(storyBrandPrompt)
        
        const landingPagePrompt = `Generate a landing page for ${serviceIdea.description}. Occupation: ${occupation.occupation}, Service Type: ${serviceIdea.serviceType}, Target Market: ${serviceIdea.targetMarket}, Value Proposition: ${serviceIdea.valueProposition}`
        const landingPage = await aiProxy.landingPage(landingPagePrompt)
        
        const conceptTitle = `${occupation.occupation} as Software - Level ${serviceIdea.level} - ${serviceIdea.serviceType}`
        const conceptContent = `# ${conceptTitle}

## Service Overview
- **Occupation**: ${occupation.occupation}
- **Service Type**: ${serviceIdea.serviceType}
- **Level**: ${serviceIdea.level}
- **Description**: ${serviceIdea.description}

## AI Capabilities
${serviceIdea.aiCapabilities.map(cap => `- ${cap}`).join('\n')}

## Target Market
${serviceIdea.targetMarket}

## Value Proposition
${serviceIdea.valueProposition}

## Agent Roles

### Executive Agents
- **CEO**: ${agentRoles.executive.ceo}
- **COO**: ${agentRoles.executive.coo}
- **CTO**: ${agentRoles.executive.cto}
- **CMO**: ${agentRoles.executive.cmo}

### Specialized Service Agents
- **Primary Agent**: ${agentRoles.specialized.primaryAgent}
- **Support Agents**: 
${agentRoles.specialized.supportAgents.map(agent => `  - ${agent}`).join('\n')}

### Meta-Agents
- **Orchestrator**: ${agentRoles.meta.orchestrator}
- **Quality Assurance**: ${agentRoles.meta.qualityAssurance}
- **Customer Success**: ${agentRoles.meta.customerSuccess}

## Business Model (Lean Canvas)
\`\`\`json
${JSON.stringify(leanCanvas, null, 2)}
\`\`\`

## Story Brand Framework
\`\`\`json
${JSON.stringify(storyBrand, null, 2)}
\`\`\`

## Landing Page Structure
\`\`\`json
${JSON.stringify(landingPage, null, 2)}
\`\`\`

---
Generated on: ${new Date().toISOString()}
Source Occupation: ${occupation.occupation}
Copy-Transform-Combine Level: ${serviceIdea.level}
`
        
        try {
          await context.db.blog.create(conceptTitle, conceptContent)
          totalConcepts++
          console.log(`    ✓ Saved concept: ${conceptTitle}`)
        } catch (error) {
          console.error(`    ✗ Failed to save concept: ${conceptTitle}`, error)
        }
      }
    }
    
    return `Generated ${totalConcepts} Services-as-Software concepts from ${relevantOccupations.length} relevant occupations`
  })
  
  console.log('Services-as-Software Generator Ready!')
  console.log('Enter a domain, industry, or occupation to generate AI-powered service concepts:')
  
  return context
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateServicesAsSoftware().then(context => {
    console.log('Generator initialized. Use the execution context to trigger idea.captured events.')
  }).catch(error => {
    console.error('Failed to initialize generator:', error)
    process.exit(1)
  })
}
