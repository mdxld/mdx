import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from '../ai'
import { createUnifiedFunction, parseTemplate, TemplateFunction } from '../utils/template'
import { title } from 'process'
import dedent from 'dedent'

const schema = z.object({
  name: z.string({ description: 'The workflow name in camelCase' }),
  on: z.string({ description: 'The event that triggers the workflow, in [Object].[Action] format, like "Customer.Subscribed"' }),
  entities: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
  })).describe('The entities involved in the workflow'),
  relationships: z.array(z.object({
    from: z.string(),
    type: z.string(),
    to: z.string(),
  })).describe('The relationships between entities in the workflow'),
  // integrations: z.array(z.object({
  //   name: z.string({ description: 'The name of the integration, like "Stripe" or "Slack"' }),
  //   functions: z.array(z.string({ description: 'The functions that can be called on the integration, like "createInvoice" or "sendMessage"' })),
  // })).describe('The integrations in the workflow'),
  steps: z.array(z.string()).describe('The steps in the workflow'),
  code: z.string().describe(dedent`
    Code a TypeScript statement that calls the on function. Put all of your logic inside the callback of the on function. 
    
    You cannot import anything, or access any globals like process, require, fetch, etc.  You have access to the following objects:

    const db: {
      [entityName: string]: {
        create: (data: any) => Promise<T>
        get: (id: string) => Promise<T | null>
        update: (id: string, data: any) => Promise<T | null>
        delete: (id: string) => Promise<T | null>
        list: () => Promise<T[]>
        find: (query: Partial<T>) => Promise<T[]>
      }
    }

    // you can call any arbitrary function on the ai object with any arguments, and the AI will figure out the implementation
    const ai: {
      [functionName: string]: (...args: any[]) => Promise<any> 
    }

    // since you cannot import or fetch anything, you can interact with any external API by calling the api object with the name of the integration and the function name
    const api: {
      [integrationName: string]: {
        [functionName: string]: (...args: any[]) => Promise<any>
      }
    }

    const on: (eventName: string) => (event: any) => Promise<any>

    `),
})

export const workflow = createUnifiedFunction(async (project, options) => {
  const result = await generateObject({
    // model: getModel()(options.model || 'anthropic/claude-opus-4'),
    // model: getModel()(options.model || 'openai/o3', { structuredOutputs: true }),
    model: getModel()(options.model || 'openai/o4-mini-high', { structuredOutputs: true }),
    // model: getModel()(options.model || 'google/gemini-2.5-pro-preview', { structuredOutputs: true }),
    system: `You are an expert at designing business workflows. `,
    prompt: `Design a workflow: ${project}`,
    schema,
  })

  return result.object
})
