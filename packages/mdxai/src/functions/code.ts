import { generateText } from 'ai'
import { model } from '../ai'
import { parseTemplate, TemplateFunction } from '../utils/template'

export const code: TemplateFunction<Promise<string>> = async (template: TemplateStringsArray, ...values: any[]) => {
  const requirements = parseTemplate(template, values)

  const result = await generateText({
    model: model('openai/gpt-4o'),
    system: `You are a senior software engineer. Respond only in TypeScript with JSDoc comments. Single quotes, no semicolons.`,
    prompt: `Code ${requirements}`,
  })
  return result.text
}
