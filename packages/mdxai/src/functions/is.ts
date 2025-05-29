import { generateObject } from 'ai'
import { model } from '../ai'
import { z } from 'zod'
import { parseTemplate } from '../utils/template'

// Custom object that behaves as boolean but exposes additional properties
class BooleanResult {
  public answer: boolean
  public thoughts: string[]
  public confidence: number

  constructor(answer: boolean, thoughts: string[], confidence: number) {
    this.answer = answer
    this.thoughts = thoughts
    this.confidence = confidence
  }

  // This makes the object behave as a boolean in conditional contexts
  valueOf(): boolean {
    return this.answer
  }

  // This makes it display nicely in console.log
  toString(): string {
    return `${this.answer} (confidence: ${this.confidence}%)`
  }

  // This makes JSON.stringify work properly
  toJSON() {
    return {
      answer: this.answer,
      thoughts: this.thoughts,
      confidence: this.confidence
    }
  }
}

interface IsOptions {
  model?: string
}

// Core implementation function
async function isCore(question: string, options: IsOptions = {}): Promise<BooleanResult> {
  const selectedModel = options.model || 'google/gemini-2.5-flash-preview-05-20'

  const result = await generateObject({
    model: model(selectedModel, { structuredOutputs: true }),
    prompt: `Is ${question}`,
    schema: z.object({
      thoughts: z.array(z.string()),
      answer: z.boolean(),
      confidence: z.number({ description: 'The percent confidence in the answer, between 0 and 100'}),
    }),
  })
  
  return new BooleanResult(result.object.answer, result.object.thoughts, result.object.confidence)
}

// Create a custom function that supports all three patterns
function createIsFunction() {
  function isFunction(...args: any[]): any {
    // Pattern 1: Normal function call - is('question', options)
    if (typeof args[0] === 'string') {
      const [question, options = {}] = args
      return isCore(question, options)
    }
    
    // Pattern 2 & 3: Template literal patterns
    if (Array.isArray(args[0]) && 'raw' in args[0]) {
      const [template, ...values] = args
      const question = parseTemplate(template as TemplateStringsArray, values)
      
      // Create a result that can be either awaited directly or called with options
      const directResult = isCore(question, {})
      
      // Add a function call capability for curried options
      const callableResult = function(options: IsOptions = {}) {
        return isCore(question, options)
      }
      
      // Copy Promise methods to the callable result
      callableResult.then = directResult.then.bind(directResult)
      callableResult.catch = directResult.catch.bind(directResult)
      callableResult.finally = directResult.finally.bind(directResult)
      
      return callableResult
    }
    
    throw new Error('is function must be called as a template literal or with string and options')
  }
  
  return isFunction
}

export const is = createIsFunction()