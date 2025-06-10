import { streamText } from 'ai'
import { model } from '../ai.js'
import { parseTemplate, stringifyValue, TemplateFunction, createUnifiedFunction } from '../utils/template.js'

export type TemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<any>

export interface AiFunction extends TemplateFn {
  [key: string | symbol]: any
}

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

const aiCore = (prompt: string, options: Record<string, any> = {}): Promise<string> => {
  return generateAiText(prompt);
};

const aiFunction: AiFunction = function (template: TemplateStringsArray | string, ...values: any[]) {
  if (typeof template === 'string') {
    return generateAiText(template);
  }
  
  if (Array.isArray(template) && 'raw' in template) {
    const prompt = parseTemplate(template, values)
    return generateAiText(prompt)
  }

  return generateAiText(String(template))
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
        return generateAiText(templateOrArgs);
      }
      
      if (Array.isArray(templateOrArgs) && 'raw' in templateOrArgs) {
        const prompt = parseTemplate(templateOrArgs as TemplateStringsArray, values)
        return generateAiText(prompt)
      } else {
        return generateAiText(stringifyValue(templateOrArgs))
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
