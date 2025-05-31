import { streamText, streamObject } from 'ai'
import { getModel } from '../ai.js'
import { createZodSchemaFromObject } from './ai-execution.js'

/**
 * Handle string output type
 * @param systemPrompt The system prompt to use
 * @returns A string result
 */
export async function handleStringOutput(systemPrompt: string): Promise<string> {
  try {
    const result = await streamText({
      model: getModel()('gpt-4o'),
      prompt: systemPrompt,
    })

    let completeText = ''
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk)
      completeText += chunk
    }

    return completeText
  } catch (error) {
    console.error('Error in handleStringOutput:', error)
    return 'Error occurred while generating content.'
  }
}

/**
 * Handle array output type
 * @param systemPrompt The system prompt to use
 * @returns An array of strings
 */
export async function handleArrayOutput(systemPrompt: string): Promise<string[]> {
  const listSystemPrompt = `${systemPrompt}\n\nRespond with a numbered markdown ordered list.`

  try {
    const result = await streamText({
      model: getModel()('gpt-4o'),
      prompt: listSystemPrompt,
    })

    let completeText = ''
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk)
      completeText += chunk
    }

    let items = completeText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^\d+\./.test(line))
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())

    if (items.length === 0) {
      items = completeText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'))
        .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    }

    if (items.length === 0) {
      items = completeText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    }

    return items
  } catch (error) {
    console.error('Error in handleArrayOutput:', error)
    return []
  }
}

/**
 * Handle object output type
 * @param systemPrompt The system prompt to use
 * @param outputSchema The schema to use for the output
 * @returns An object result
 */
export async function handleObjectOutput(systemPrompt: string, outputSchema: Record<string, any>): Promise<any> {
  try {
    const zodSchema = createZodSchemaFromObject(outputSchema)

    const result = await streamObject({
      model: getModel()('gpt-4o'),
      prompt: systemPrompt,
      schema: zodSchema,
    })

    for await (const chunk of result.partialObjectStream) {
      process.stdout.write(JSON.stringify(chunk) + '\n')
    }

    return result.object
  } catch (error) {
    console.error('Error in handleObjectOutput:', error)

    const fallbackObject: Record<string, any> = {}

    for (const [key, value] of Object.entries(outputSchema)) {
      if (typeof value === 'string') {
        if (value.includes('|')) {
          fallbackObject[key] = value.split('|')[0].trim()
        } else {
          fallbackObject[key] = `Fallback ${key}`
        }
      } else if (Array.isArray(value)) {
        fallbackObject[key] = [`Fallback ${key} item`]
      } else if (typeof value === 'object') {
        fallbackObject[key] = {}
      }
    }

    return fallbackObject
  }
}        