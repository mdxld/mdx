import { generateObject } from 'ai'
import { getModel } from '../ai'
import { z } from 'zod'
import { parseTemplate, createUnifiedFunction } from '../utils/template'

interface IsOptions {
  model?: string
  temperature?: number
  apiKey?: string
  baseURL?: string
}

// Enhanced result with debug info
interface IsResult {
  answer: boolean
  thoughts: string[]
  confidence: number
}

// Core implementation function
async function isCore(question: string, options: IsOptions = {}): Promise<IsResult> {
  const selectedModel = options.model || 'google/gemini-2.5-flash-preview-05-20'
  const aiModel = getModel()

  const result = await generateObject({
    model: aiModel(selectedModel, { structuredOutputs: true }),
    prompt: `Is ${question}`,
    schema: z.object({
      thoughts: z.array(z.string()),
      answer: z.boolean(),
      confidence: z.number({ description: 'The percent confidence in the answer, between 0 and 100'}),
    }),
    temperature: options.temperature || 0,
  })
  
  return result.object
}

// Function overload types
interface IsFunction {
  // Template literal pattern - returns primitive boolean
  (template: TemplateStringsArray, ...values: any[]): Promise<boolean> & {
    // Callable for enhanced result with options
    (options?: IsOptions): Promise<IsResult>
  }
  
  // Regular function pattern
  (question: string, options?: IsOptions): Promise<boolean | IsResult>
}

function isWrapper(question: string, options: Record<string, any> = {}): any {
  // If options provided, return enhanced result
  if (Object.keys(options).length > 0) {
    return isCore(question, options as IsOptions)
  }
  
  // Otherwise return primitive boolean
  const primitivePromise = isCore(question, {}).then(result => result.answer)
  
  const callablePromise = function(callOptions: IsOptions = {}) {
    return isCore(question, callOptions)
  }
  
  // Copy Promise methods to make it awaitable
  callablePromise.then = primitivePromise.then.bind(primitivePromise)
  callablePromise.catch = primitivePromise.catch.bind(primitivePromise)
  callablePromise.finally = primitivePromise.finally.bind(primitivePromise)
  
  return callablePromise
}

// Create the enhanced function using createUnifiedFunction
export const is: IsFunction = createUnifiedFunction<any>(isWrapper)
export type { IsOptions, IsResult }
