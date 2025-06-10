import { generateObject } from 'ai'
import { z } from 'zod'
import { createAIModel } from '../ai.js'
import { parseTemplate, createUnifiedFunction } from '../utils/template.js'

const workflowStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['manual', 'automated', 'approval', 'condition']),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  conditions: z.array(z.string()).optional(),
  estimatedDuration: z.string().optional(),
  assignee: z.string().optional(),
})

const workflowSchema = z.object({
  name: z.string(),
  description: z.string(),
  steps: z.array(workflowStepSchema),
  triggers: z.array(z.string()),
  outcomes: z.array(z.string()),
})

interface WorkflowOptions {
  apiKey?: string
  baseURL?: string
  model?: string
  includeAutomation?: boolean
}

async function workflowCore(processDescription: string, options: WorkflowOptions = {}): Promise<z.infer<typeof workflowSchema>> {
  const selectedModel = options.model || 'google/gemini-2.5-flash-preview-05-20'
  const aiModel = createAIModel(options.apiKey, options.baseURL)

  const {
    includeAutomation = true
  } = options

  let systemPrompt = 'You are an expert process designer. Create a detailed workflow with clear steps, inputs, outputs, and conditions.'
  
  if (includeAutomation) {
    systemPrompt += ' Include automation opportunities where appropriate.'
  }

  const result = await generateObject({
    model: aiModel(selectedModel),
    system: systemPrompt,
    prompt: `Design a workflow for: ${processDescription}`,
    schema: workflowSchema,
  })
  
  return result.object
}

export const workflow = createUnifiedFunction<Promise<z.infer<typeof workflowSchema>>>(
  (processDescription: string, options: Record<string, any>) => {
    return workflowCore(processDescription, options as WorkflowOptions);
  }
);
