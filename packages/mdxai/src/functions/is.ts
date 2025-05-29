import { generateObject } from 'ai'
import { createAIModel } from '../ai'
import { z } from 'zod'
import { parseTemplate } from '../utils/template'

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
  const aiModel = createAIModel(options.apiKey, options.baseURL)

  const result = await generateObject({
    model: aiModel(selectedModel, { structuredOutputs: true }),
    prompt: `Is ${question}`,
    schema: z.object({
      thoughts: z.array(z.string()),
      answer: z.boolean(),
      confidence: z.number({ description: 'The percent confidence in the answer, between 0 and 100'}),
    }),
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

// Create the enhanced function
function createIsFunction(): IsFunction {
  function isFunction(...args: any[]): any {
    // Pattern 1: Normal function call - is('question', options)
    if (typeof args[0] === 'string') {
      const [question, options = {}] = args
      
      // If options provided, return enhanced result
      if (Object.keys(options).length > 0) {
        return isCore(question, options)
      }
      
      // Otherwise return primitive boolean
      return isCore(question, {}).then(result => result.answer)
    }
    
    // Pattern 2: Template literal - is`question`
    if (Array.isArray(args[0]) && 'raw' in args[0]) {
      const [template, ...values] = args
      const question = parseTemplate(template as TemplateStringsArray, values)
      
      // Create a promise that resolves to primitive boolean
      const primitivePromise = isCore(question, {}).then(result => result.answer)
      
      // Add callable functionality for enhanced result
      const callablePromise = function(options: IsOptions = {}) {
        return isCore(question, options)
      }
      
      // Copy Promise methods to make it awaitable
      callablePromise.then = primitivePromise.then.bind(primitivePromise)
      callablePromise.catch = primitivePromise.catch.bind(primitivePromise)
      callablePromise.finally = primitivePromise.finally.bind(primitivePromise)
      
      return callablePromise
    }
    
    throw new Error('is function must be called as a template literal or with string and options')
  }
  
  return isFunction as IsFunction
}

export const is = createIsFunction()
export type { IsOptions, IsResult }
