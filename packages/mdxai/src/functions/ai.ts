import { streamText } from 'ai'
import { model } from '../ai'
import { parseTemplate, stringifyValue, TemplateFunction } from '../utils/template'
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
    for await (const chunk of result.textStream) {
      completeText += chunk
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
const aiFunction: AiFunction = function (template: TemplateStringsArray, ...values: any[]) {
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

    return function (templateOrArgs: TemplateStringsArray | Record<string, any>, ...values: any[]) {
      if (Array.isArray(templateOrArgs) && 'raw' in templateOrArgs) {
        const prompt = parseTemplate(templateOrArgs as TemplateStringsArray, values)
        return executeAiFunction(propName, prompt)
      } else {
        return executeAiFunction(propName, stringifyValue(templateOrArgs))
      }
    }
  },

  apply(target, thisArg, args) {
    if (Array.isArray(args[0]) && 'raw' in args[0]) {
      const prompt = parseTemplate(args[0] as TemplateStringsArray, args.slice(1))
      return generateAiText(prompt)
    }

    throw new Error('AI object must be called as a template literal or with a property access')
  },
}) 