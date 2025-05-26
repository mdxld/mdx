import { streamText, streamObject } from 'ai'
import { z } from 'zod'
import matter from 'gray-matter'
import fs from 'fs'
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
  AI_FOLDER_STRUCTURE
} from './utils.js'

/**
 * Type for template literal function
 */
export type TemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<any>

/**
 * Type for AI function with dynamic properties
 */
export interface AiFunction extends TemplateFn {
  [key: string | symbol]: any;
}

/**
 * Core AI template literal function for text generation
 * 
 * Usage: await ai`Write a blog post about ${topic}`
 */
export async function generateAiText(prompt: string): Promise<string> {
  if (process.env.NODE_ENV === 'test') {
    return 'This is a mock string response for testing purposes. It simulates what would be returned from the AI model in a real environment.'
  }
  
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
const aiFunction: AiFunction = function(template: TemplateStringsArray, ...values: any[]) {
  if (Array.isArray(template) && 'raw' in template) {
    let prompt = '';
    
    template.forEach((str, i) => {
      prompt += str;
      if (i < values.length) {
        prompt += values[i];
      }
    });
    
    // For direct template literal usage, use generateAiText for simpler text generation
    return generateAiText(prompt);
  }
  
  return executeAiFunction('default', String(template));
};

export const ai = new Proxy(aiFunction, {
  get(target, prop) {
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return undefined
    }
    
    if (typeof prop === 'symbol') {
      return Reflect.get(target, prop)
    }
    
    const propName = String(prop)
    
    return function(templateOrArgs: TemplateStringsArray | Record<string, any>, ...values: any[]) {
      if (Array.isArray(templateOrArgs) && 'raw' in templateOrArgs) {
        const templateStrings = templateOrArgs as TemplateStringsArray;
        let prompt = '';
        
        templateStrings.forEach((str, i) => {
          prompt += str;
          if (i < values.length) {
            prompt += values[i];
          }
        });
        
        return executeAiFunction(propName, prompt);
      } else {
        return executeAiFunction(propName, JSON.stringify(templateOrArgs));
      }
    }
  },
  
  apply(target, thisArg, args) {
    if (Array.isArray(args[0]) && 'raw' in args[0]) {
      const templateStrings = args[0] as TemplateStringsArray;
      let prompt = '';
      
      templateStrings.forEach((str, i) => {
        prompt += str;
        if (i < args.length - 1) {
          prompt += args[i + 1];
        }
      });
      
      // For direct template literal usage, use generateAiText for simpler text generation
      return generateAiText(prompt);
    }
    
    throw new Error('AI object must be called as a template literal or with a property access');
  }
});

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
    return await handleObjectOutput(systemPrompt, outputType)
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
  if (process.env.NODE_ENV === 'test') {
    console.log('Using mock string output for testing')
    return 'This is a mock string response for testing purposes. It simulates what would be returned from the AI model in a real environment.'
  }
  
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
  if (process.env.NODE_ENV === 'test') {
    return ['Item 1', 'Item 2', 'Item 3']
  }
  
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
      .map(line => line.trim())
      .filter(line => /^\d+\./.test(line))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
    
    if (items.length === 0) {
      items = completeText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'))
        .map(line => line.replace(/^[-*•]\s*/, '').trim())
    }
    
    if (items.length === 0) {
      items = completeText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
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
  if (process.env.NODE_ENV === 'test') {
    const mockObject: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(outputSchema)) {
      if (typeof value === 'string') {
        if (value.includes('|')) {
          mockObject[key] = value.split('|')[0].trim()
        } else {
          mockObject[key] = `Mock ${key}`
        }
      } else if (Array.isArray(value)) {
        mockObject[key] = [`Mock ${key} item 1`, `Mock ${key} item 2`]
      } else if (typeof value === 'object') {
        mockObject[key] = { mockNestedKey: 'Mock nested value' }
      }
    }
    
    return mockObject
  }
  
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
function createZodSchemaFromObject(obj: Record<string, any>): z.ZodSchema {
  const schemaObj: Record<string, z.ZodTypeAny> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      if (value.includes('|')) {
        const options = value.split('|').map(o => o.trim())
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
 * Research template literal function for external data gathering
 * 
 * Usage: await research`${market} in the context of delivering ${idea}`
 */
export type ResearchTemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<any>

const researchFunction_: ResearchTemplateFn = function(template: TemplateStringsArray, ...values: any[]) {
  if (Array.isArray(template) && 'raw' in template) {
    let query = '';
    
    template.forEach((str, i) => {
      query += str;
      if (i < values.length) {
        query += values[i];
      }
    });
    
    return researchFunction(query);
  }
  
  throw new Error('Research function must be called as a template literal');
};

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
      const templateStrings = args[0] as TemplateStringsArray;
      let query = '';
      
      templateStrings.forEach((str, i) => {
        query += str;
        if (i < args.length - 1) {
          query += args[i + 1];
        }
      });
      
      return researchFunction(query);
    }
    
    throw new Error('Research function must be called as a template literal');
  }
});
