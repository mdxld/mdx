import { z } from 'zod'
import { MdxFrontmatter } from './types'

/**
 * Create Zod schemas from frontmatter input/output definitions
 */
export function createSchemaFromFrontmatter(frontmatter: MdxFrontmatter) {
  const inputSchema = frontmatter.input ? createInputSchema(frontmatter.input) : undefined
  const outputSchema = frontmatter.output ? createOutputSchema(frontmatter.output) : undefined

  return { inputSchema, outputSchema }
}

/**
 * Create a Zod schema from input definitions
 */
function createInputSchema(input: Record<string, string>) {
  const schemaObj: Record<string, z.ZodTypeAny> = {}

  Object.entries(input).forEach(([key, type]) => {
    schemaObj[key] = createZodType(type)
  })

  return z.object(schemaObj)
}

/**
 * Create a Zod schema from output definitions
 */
function createOutputSchema(output: Record<string, string>) {
  const schemaObj: Record<string, z.ZodTypeAny> = {}

  Object.entries(output).forEach(([key, type]) => {
    schemaObj[key] = createZodType(type)
  })

  return z.object(schemaObj)
}

/**
 * Create a Zod type from a string type definition
 */
export function createZodType(type: string): z.ZodTypeAny {
  if (type === 'string') {
    return z.string()
  }

  if (type === 'number') {
    return z.number()
  }

  if (type === 'boolean') {
    return z.boolean()
  }

  if (type === 'array') {
    return z.array(z.any())
  }

  if (type === 'object') {
    return z.record(z.any())
  }

  if (type.startsWith('enum[')) {
    const options = type
      .replace('enum[', '')
      .replace(']', '')
      .split(',')
      .map((o) => o.trim())
    return z.enum(options as [string, ...string[]])
  }

  return z.string()
}

/**
 * Create Zod schema from YAML description with type annotations
 * @param yamlDescription YAML object with descriptions as values
 * @returns Zod schema object
 */
export function createSchemaFromDescription(yamlDescription: Record<string, any>): z.ZodObject<any> {
  const schemaObj: Record<string, z.ZodTypeAny> = {}

  Object.entries(yamlDescription).forEach(([key, description]) => {
    if (typeof description !== 'string') {
      schemaObj[key] = z.string().describe(String(description))
      return
    }

    const typeAnnotationMatch = description.match(/\(([^)]+)\)$/)
    const enumMatch = description.match(/\(([^)]*\|[^)]*)\)$/) || description.match(/([^(]*\|[^(]*)$/)

    let baseDescription = description
    let zodType: z.ZodTypeAny = z.string()

    if (enumMatch) {
      const enumValues = enumMatch[1]
        .split('|')
        .map((v) => v.trim())
        .filter(Boolean)
      if (enumValues.length >= 1) {
        zodType = z.enum(enumValues as [string, ...string[]])
        baseDescription = description
          .replace(/\([^)]*\|[^)]*\)$/, '')
          .replace(/[^(]*\|[^(]*$/, '')
          .trim()
      }
    } else if (typeAnnotationMatch) {
      const typeAnnotation = typeAnnotationMatch[1].toLowerCase()
      baseDescription = description.replace(/\([^)]*\)$/, '').trim()

      switch (typeAnnotation) {
        case 'bool':
        case 'boolean':
          zodType = z.boolean()
          break
        case 'number':
        case 'num':
          zodType = z.number()
          break
        case 'date':
        case 'datetime':
          zodType = z.string().datetime()
          break
        case 'array':
          zodType = z.array(z.any())
          break
        case 'object':
          zodType = z.record(z.any())
          break
        default:
          zodType = z.string()
      }
    }

    schemaObj[key] = zodType.describe(baseDescription)
  })

  return z.object(schemaObj)
}
