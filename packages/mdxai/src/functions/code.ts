import { generateObject, generateText } from 'ai'
import { model } from '../ai'
import { z } from 'zod'
import { parseTemplate, TemplateFunction } from '../utils/template'

export const code: TemplateFunction<Promise<string>> = async (template: TemplateStringsArray, ...values: any[]) => {
  const requirements = parseTemplate(template, values)

  const result = await generateText({
    model: model('anthropic/claude-opus-4'),
    system: `You are a senior software engineer. Respond only in TypeScript with JSDoc comments. Single quotes, no semicolons.`,
    prompt: `Code ${requirements}`,
  })
  return result.text
}