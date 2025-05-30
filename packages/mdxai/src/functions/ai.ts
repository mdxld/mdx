import { streamText } from 'ai'
import { model } from '../ai'
import { parseTemplate, stringifyValue, TemplateFunction, createUnifiedFunction } from '../utils/template'
import { executeAiFunction } from '../utils/ai-execution'

/**
 * Type for template literal function
 */
export type TemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<any>

/**
 * Type for AI function with dynamic properties
 */
export interface AiFunction extends TemplateFn {
  [key: string | symbol]: any
}

/**
 * Core AI template literal function for text generation
 *
 * Usage: await ai`Write a blog post about ${topic}`
 */
export async function generateAiText(prompt: string): Promise<string> {
  try {
    const result = await streamText({
      model: model('google/gemini-2.5-pro-preview'),
      prompt: prompt,
    })

    let completeText = ''
    
    if (result && result.textStream) {
      for await (const chunk of result.textStream) {
        completeText += chunk
      }
    } else if (result && result.text) {
      completeText = await result.text
    } else {
      throw new Error('No valid response received from AI service')
    }

    return completeText
  } catch (error) {
    console.error('Error in generateAiText:', error)
    throw new Error('Failed to generate AI content')
  }
}

/**
 * AI object with template literal and dynamic function support
 *
 * Usage:
 * - Template literal: ai`Write a blog post about ${topic}`
 * - Function with template: ai.list`Generate ${count} blog post titles about ${topic}`
 * - Function with object: ai.storyBrand({ brand: 'vercel' })
 */
const aiCore = (prompt: string, options: Record<string, any> = {}): Promise<string> => {
  return generateAiText(prompt);
};

const aiFunction: AiFunction = function (template: TemplateStringsArray | string, ...values: any[]) {
  if (typeof template === 'string') {
    return executeAiFunction('default', template);
  }
  
  if (Array.isArray(template) && 'raw' in template) {
    const prompt = parseTemplate(template, values)
    return generateAiText(prompt)
  }

  return executeAiFunction('default', String(template))
}

export const ai = new Proxy(aiFunction, {
  get(target, prop) {
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return undefined
    }

    if (typeof prop === 'symbol') {
      return Reflect.get(target, prop)
    }

    const propName = String(prop)

    return function (templateOrArgs: TemplateStringsArray | Record<string, any> | string, ...values: any[]) {
      if (typeof templateOrArgs === 'string') {
        return executeAiFunction(propName, templateOrArgs);
      }
      
      if (Array.isArray(templateOrArgs) && 'raw' in templateOrArgs) {
        const prompt = parseTemplate(templateOrArgs as TemplateStringsArray, values)
        return executeAiFunction(propName, prompt)
      } else {
        return executeAiFunction(propName, stringifyValue(templateOrArgs))
      }
    }
  },

  apply(target, thisArg, args) {
    const [first, ...rest] = args;
    
    if (typeof first === 'string') {
      return generateAiText(first);
    }
    
    if (Array.isArray(first) && 'raw' in first) {
      const prompt = parseTemplate(first as TemplateStringsArray, rest)
      return generateAiText(prompt)
    }

    throw new Error('AI object must be called as a template literal, with a string, or with a property access')
  },
})            