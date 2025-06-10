import { generateObject } from 'ai'
import { z } from 'zod'
import { createAIModel } from '../ai.js'
import { parseTemplate, createUnifiedFunction } from '../utils/template.js'

const scopeSchema = z.object({
  inScope: z.array(z.string()),
  outOfScope: z.array(z.string()),
  assumptions: z.array(z.string()),
  constraints: z.array(z.string()),
  deliverables: z.array(z.string()),
  successCriteria: z.array(z.string()),
})

interface ScopeOptions {
  apiKey?: string
  baseURL?: string
  model?: string
}

async function scopeCore(projectDescription: string, options: ScopeOptions = {}): Promise<z.infer<typeof scopeSchema>> {
  const selectedModel = options.model || 'google/gemini-2.5-flash-preview-05-20'
  const aiModel = createAIModel(options.apiKey, options.baseURL)

  const result = await generateObject({
    model: aiModel(selectedModel),
    system: `You are an expert project manager. Define clear project scope including what's in scope, out of scope, assumptions, constraints, deliverables, and success criteria.`,
    prompt: `Define the scope for this project: ${projectDescription}`,
    schema: scopeSchema,
  })
  
  return result.object
}

export const scope = createUnifiedFunction<Promise<z.infer<typeof scopeSchema>>>(
  (projectDescription: string, options: Record<string, any>) => {
    return scopeCore(projectDescription, options as ScopeOptions);
  }
);
