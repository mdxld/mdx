import fs from 'fs'
import matter from 'gray-matter'
import { z } from 'zod'
import { findAiFunctionEnhanced, ensureAiFunctionExists } from '../utils.js'
import { handleStringOutput, handleArrayOutput, handleObjectOutput } from './output-handlers.js'

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