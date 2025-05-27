import { streamText, streamObject } from 'ai'
import { z } from 'zod'
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'
import { GoogleGenAI } from '@google/genai'
import wav from 'wav'
import { model } from './ai.js'
import { research as researchFunction } from './functions/research.js'
import {
  findAiFunction,
  findAiFunctionEnhanced,
  ensureAiFunctionExists,
  createAiFolderStructure,
  writeAiFunction,
  findAiFunctionsInHierarchy,
  createAiFunctionVersion,
  listAiFunctionVersions,
  AI_FOLDER_STRUCTURE,
  ensureDirectoryExists,
} from './utils.js'
import hash from 'object-hash'
import { generateListStream, generateImageStream } from './llmService.js'
import yaml from 'yaml'

/**
 * Type for template literal function
 */
export type TemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<any>

/**
 * Type definition for the list function that supports both Promise and AsyncIterable
 */
export type ListFunction = {
  (strings: TemplateStringsArray, ...values: any[]): Promise<string[]> & AsyncIterable<string>
}

/**
 * Type for AI function with dynamic properties
 */
export interface AiFunction extends TemplateFn {
  [key: string | symbol]: any
  list?: ListFunction
}

/**
 * Stringify a value to YAML if it's an array or object, otherwise return as string
 * @param value The value to stringify
 * @returns The stringified value
 */
function stringifyValue(value: any): string {
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    return yaml.stringify(value).trim()
  }
  return String(value)
}

/**
 * Core AI template literal function for text generation
 *
 * Usage: await ai`Write a blog post about ${topic}`
 */
export async function generateAiText(prompt: string): Promise<string> {
  try {
    const result = await streamText({
      model: model('gpt-4o'),
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
    let prompt = ''

    template.forEach((str, i) => {
      prompt += str
      if (i < values.length) {
        prompt += stringifyValue(values[i])
      }
    })

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
        const templateStrings = templateOrArgs as TemplateStringsArray
        let prompt = ''

        templateStrings.forEach((str, i) => {
          prompt += str
          if (i < values.length) {
            prompt += stringifyValue(values[i])
          }
        })

        return executeAiFunction(propName, prompt)
      } else {
        return executeAiFunction(propName, stringifyValue(templateOrArgs))
      }
    }
  },

  apply(target, thisArg, args) {
    if (Array.isArray(args[0]) && 'raw' in args[0]) {
      const templateStrings = args[0] as TemplateStringsArray
      let prompt = ''

      templateStrings.forEach((str, i) => {
        prompt += str
        if (i < args.length - 1) {
          prompt += stringifyValue(args[i + 1])
        }
      })

      return generateAiText(prompt)
    }

    throw new Error('AI object must be called as a template literal or with a property access')
  },
})

/**
 * Execute an AI function by name with the given prompt
 * @param functionName Name of the AI function to execute
 * @param prompt The prompt to pass to the function
 * @returns The result of the AI function execution
 */
export async function executeAiFunction(functionName: string, prompt: string): Promise<any> {
  let aiFile = await findAiFunctionEnhanced(functionName)

  if (!aiFile) {
    try {
      const createdPath = ensureAiFunctionExists(functionName)
      aiFile = await findAiFunctionEnhanced(functionName)
      if (!aiFile) {
        throw new Error(`Failed to create AI function '${functionName}'`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`AI function '${functionName}' not found in .ai directory and could not be created: ${errorMessage}`)
    }
  }

  const { data: frontmatter, content: template } = matter(aiFile.filePath ? fs.readFileSync(aiFile.filePath, 'utf-8') : aiFile.content)
  const systemPrompt = template.replace(/\$\{prompt\}/g, prompt)

  const outputType = frontmatter.output

  if (typeof outputType === 'string') {
    if (outputType === 'array') {
      return await handleArrayOutput(systemPrompt)
    } else {
      return await handleStringOutput(systemPrompt)
    }
  } else if (Array.isArray(outputType)) {
    return await handleArrayOutput(systemPrompt)
  } else if (typeof outputType === 'object') {
    const result = await handleObjectOutput(systemPrompt, outputType)
    return inferAndValidateOutput(outputType, result)
  } else {
    return await handleStringOutput(systemPrompt)
  }
}

/**
 * Handle string output type
 * @param systemPrompt The system prompt to use
 * @returns A string result
 */
async function handleStringOutput(systemPrompt: string): Promise<string> {
  try {
    const result = await streamText({
      model: model('gpt-4o'),
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
async function handleArrayOutput(systemPrompt: string): Promise<string[]> {
  const listSystemPrompt = `${systemPrompt}\n\nRespond with a numbered markdown ordered list.`

  try {
    const result = await streamText({
      model: model('gpt-4o'),
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
async function handleObjectOutput(systemPrompt: string, outputSchema: Record<string, any>): Promise<any> {
  try {
    const zodSchema = createZodSchemaFromObject(outputSchema)

    const result = await streamObject({
      model: model('gpt-4o'),
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

/**
 * Create a Zod schema from an object
 * @param obj The object to create a schema from
 * @returns A Zod schema
 */
export function createZodSchemaFromObject(obj: Record<string, any>): z.ZodSchema {
  const schemaObj: Record<string, z.ZodTypeAny> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      if (value.includes('|')) {
        const options = value.split('|').map((o) => o.trim())
        schemaObj[key] = z.enum(options as [string, ...string[]])
      } else {
        schemaObj[key] = z.string().describe(value)
      }
    } else if (Array.isArray(value)) {
      schemaObj[key] = z.array(z.string())
    } else if (typeof value === 'object') {
      schemaObj[key] = createZodSchemaFromObject(value)
    } else {
      schemaObj[key] = z.string().describe(String(value))
    }
  }

  return z.object(schemaObj)
}

/**
 * Infer and validate AI function output types
 * @param outputSchema The output schema from frontmatter
 * @param result The actual result from AI function
 * @returns Validated and typed result
 */
export function inferAndValidateOutput(outputSchema: any, result: any): any {
  if (!outputSchema) {
    return result
  }

  try {
    if (typeof outputSchema === 'object' && !Array.isArray(outputSchema)) {
      const zodSchema = createZodSchemaFromObject(outputSchema)
      return zodSchema.parse(result)
    }
    return result
  } catch (error) {
    console.warn('Type validation failed:', error)
    return result // Return original result if validation fails
  }
}

/**
 * Create async iterator that yields list items as they're parsed from the stream
 */
async function* createListAsyncIterator(prompt: string): AsyncGenerator<string, void, unknown> {
  try {
    const result = await generateListStream(prompt)
    let buffer = ''
    const seenItems = new Set<string>()

    for await (const chunk of result.textStream) {
      buffer += chunk

      const lines = buffer.split('\n')
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (/^\d+\./.test(trimmedLine)) {
          const item = trimmedLine.replace(/^\d+\.\s*/, '').trim()
          if (item && !seenItems.has(item)) {
            seenItems.add(item)

            try {
              const parsedItem = JSON.parse(item)
              if (typeof parsedItem === 'object' && parsedItem !== null) {
                yield stringifyValue(parsedItem)
                continue
              }
            } catch (e) {}

            yield item
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in list async iterator:', error)
    throw error
  }
}

/**
 * Generate complete list as Promise<string[]>
 */
async function generateCompleteList(prompt: string): Promise<string[]> {
  try {
    const result = await generateListStream(prompt)
    let completeContent = ''

    for await (const chunk of result.textStream) {
      completeContent += chunk
    }

    let items = completeContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^\d+\./.test(line))
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())

    if (items.length === 0) {
      items = completeContent
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'))
        .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    }

    return items.map((item) => {
      try {
        const parsedItem = JSON.parse(item)
        if (typeof parsedItem === 'object' && parsedItem !== null) {
          return stringifyValue(parsedItem)
        }
        return item
      } catch (e) {
        return item
      }
    })
  } catch (error) {
    console.error('Error in generateCompleteList:', error)
    throw error
  }
}

/**
 * List template literal function for generating arrays of items with async iterator support
 *
 * Usage:
 * - As Promise: const items = await list`10 ideas for ${topic}`
 * - As AsyncIterable: for await (const item of list`10 ideas for ${topic}`) { ... }
 */
export const list = new Proxy(function () {}, {
  apply: (target: any, thisArg: any, args: any[]) => {
    if (args[0] && Array.isArray(args[0]) && 'raw' in args[0]) {
      const [template, ...expressions] = args
      const prompt = String.raw({ raw: template }, ...expressions)

      const listFunction: any = () => generateCompleteList(prompt)

      listFunction.then = (resolve: any, reject: any) => {
        return generateCompleteList(prompt).then(resolve, reject)
      }

      listFunction.catch = (reject: any) => {
        return generateCompleteList(prompt).catch(reject)
      }

      listFunction.finally = (callback: any) => {
        return generateCompleteList(prompt).finally(callback)
      }

      listFunction[Symbol.asyncIterator] = () => createListAsyncIterator(prompt)

      return listFunction
    }

    throw new Error('list function must be used as a template literal tag')
  },
}) as ListFunction

/**
 * Research template literal function for external data gathering
 *
 * Usage: await research`${market} in the context of delivering ${idea}`
 */
export type ResearchTemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<any>

const researchFunction_: ResearchTemplateFn = function (template: TemplateStringsArray, ...values: any[]) {
  if (Array.isArray(template) && 'raw' in template) {
    let query = ''

    template.forEach((str, i) => {
      query += str
      if (i < values.length) {
        if (values[i] !== null && typeof values[i] === 'object') {
          query += yaml.stringify(values[i])
        } else {
          query += values[i]
        }
      }
    })

    return researchFunction(query)
  }

  throw new Error('Research function must be called as a template literal')
}

export const research = new Proxy(researchFunction_, {
  get(target, prop) {
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return undefined
    }

    if (typeof prop === 'symbol') {
      return Reflect.get(target, prop)
    }

    return target
  },

  apply(target, thisArg, args) {
    if (Array.isArray(args[0]) && 'raw' in args[0]) {
      const templateStrings = args[0] as TemplateStringsArray
      let query = ''

      templateStrings.forEach((str, i) => {
        query += str
        if (i < args.length - 1) {
          if (args[i + 1] !== null && typeof args[i + 1] === 'object') {
            query += yaml.stringify(args[i + 1])
          } else {
            query += args[i + 1]
          }
        }
      })

      return researchFunction(query)
    }

    throw new Error('Research function must be called as a template literal')
  },
})

/**
 * Save audio buffer as WAV file
 */
async function saveWaveFile(
  filename: string,
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const writer = new wav.FileWriter(filename, {
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    })

    writer.on('finish', () => resolve())
    writer.on('error', (error) => reject(error))

    writer.write(pcmData)
    writer.end()
  })
}

/**
 * Generate audio using Google Gemini TTS
 */
async function generateSpeechAudio(text: string, options: { voiceName?: string; apiKey?: string } = {}): Promise<string> {
  if (process.env.NODE_ENV === 'test') {
    return 'mock-audio-file.wav'
  }

  const apiKey = options.apiKey || process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: options.voiceName || 'Kore' },
        },
      },
    },
  })

  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
  if (!data) {
    throw new Error('No audio data received from Google GenAI')
  }

  const audioBuffer = Buffer.from(data, 'base64')
  
  const cacheKey = hash({ text, voiceName: options.voiceName || 'Kore' })
  const cacheDir = path.join(process.cwd(), AI_FOLDER_STRUCTURE.ROOT, AI_FOLDER_STRUCTURE.CACHE)
  ensureDirectoryExists(cacheDir)
  
  const fileName = path.join(cacheDir, `${cacheKey}.wav`)
  await saveWaveFile(fileName, audioBuffer)
  
  return fileName
}

/**
 * Say template literal function for text-to-speech generation
 *
 * Usage: await say`Say cheerfully: Have a wonderful day!`
 */
export type SayTemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<string>

const sayFunction_: SayTemplateFn = function (template: TemplateStringsArray, ...values: any[]) {
  if (Array.isArray(template) && 'raw' in template) {
    let text = ''

    template.forEach((str, i) => {
      text += str
      if (i < values.length) {
        text += stringifyValue(values[i])
      }
    })

    return generateSpeechAudio(text)
  }

  throw new Error('Say function must be called as a template literal')
}

export const say = new Proxy(sayFunction_, {
  get(target, prop) {
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return undefined
    }

    if (typeof prop === 'symbol') {
      return Reflect.get(target, prop)
    }

    return target
  },

  apply(target, thisArg, args) {
    if (Array.isArray(args[0]) && 'raw' in args[0]) {
      const templateStrings = args[0] as TemplateStringsArray
      let text = ''

      templateStrings.forEach((str, i) => {
        text += str
        if (i < args.length - 1) {
          text += stringifyValue(args[i + 1])
        }
      })

      return generateSpeechAudio(text)
    }

    throw new Error('Say function must be called as a template literal')
  },
})

/**
 * Image template literal function for AI image generation
 *
 * Usage: await image`A salamander at sunrise in a forest pond in the Seychelles.`
 */
export type ImageTemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<any>

const imageFunction_: ImageTemplateFn = function (template: TemplateStringsArray, ...values: any[]) {
  if (Array.isArray(template) && 'raw' in template) {
    let prompt = ''

    template.forEach((str, i) => {
      prompt += str
      if (i < values.length) {
        if (values[i] !== null && typeof values[i] === 'object') {
          prompt += yaml.stringify(values[i])
        } else {
          prompt += values[i]
        }
      }
    })

    return generateImageStream(prompt)
  }

  throw new Error('Image function must be called as a template literal')
}

export const image = new Proxy(imageFunction_, {
  get(target, prop) {
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return undefined
    }

    if (typeof prop === 'symbol') {
      return Reflect.get(target, prop)
    }

    return target
  },

  apply(target, thisArg, args) {
    if (Array.isArray(args[0]) && 'raw' in args[0]) {
      const templateStrings = args[0] as TemplateStringsArray
      let prompt = ''

      templateStrings.forEach((str, i) => {
        prompt += str
        if (i < args.length - 1) {
          if (args[i + 1] !== null && typeof args[i + 1] === 'object') {
            prompt += yaml.stringify(args[i + 1])
          } else {
            prompt += args[i + 1]
          }
        }
      })

      return generateImageStream(prompt)
    }

    throw new Error('Image function must be called as a template literal')
  },
})
