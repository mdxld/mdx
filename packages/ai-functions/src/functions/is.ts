import { generateObject } from 'ai'
import { z } from 'zod'
import { createAIModel } from '../ai.js'
import { parseTemplate, createUnifiedFunction } from '../utils/template.js'

const isSchema = z.object({
  answer: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
})

interface IsOptions {
  apiKey?: string
  baseURL?: string
  model?: string
}

async function isCore(question: string, options: IsOptions = {}): Promise<{ answer: boolean; confidence: number; reasoning: string }> {
  const selectedModel = options.model || 'google/gemini-2.5-flash-preview-05-20'
  const aiModel = createAIModel(options.apiKey, options.baseURL)

  const result = await generateObject({
    model: aiModel(selectedModel),
    system: `You are an expert evaluator. Answer the given question with a boolean response, confidence score (0-1), and reasoning.`,
    prompt: question,
    schema: isSchema,
  })
  
  return result.object
}

export const is = createUnifiedFunction<Promise<{ answer: boolean; confidence: number; reasoning: string }>>(
  (question: string, options: Record<string, any>) => {
    return isCore(question, options as IsOptions);
  }
);
