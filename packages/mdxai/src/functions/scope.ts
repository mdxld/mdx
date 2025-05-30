import { generateObject } from 'ai'
import { z } from 'zod'
import { model } from '../ai'
import { createUnifiedFunction, parseTemplate, TemplateFunction } from '../utils/template'
import { title } from 'process'

const schema = z.object({
  title: z.string(),
  tasks: z.array(z.string()),
  // tasks: z.array(z.object({
  //   type: z.enum([
  //     // 'Scope & Develop Epic', 
  //     'Design Data Model', 
  //     'Integrate External API',
  //     'Design & Develop UI Component',
  //     'Develop & Test Function',
  //     'Test End-to-End',
  //   ]),
  //   task: z.string(),
  // })),
  // entities: z.array(z.object({
  //   name: z.string(),
  //   type: z.string(),
  //   observations: z.array(z.string()),
  // })),
  // relationships: z.array(z.object({
  //   from: z.string(),
  //   type: z.string(),
  //   to: z.string(),
  // })),
})

export const scope = createUnifiedFunction(async (project, options) => {
  const result = await generateObject({
    // model: model(options.model || 'anthropic/claude-opus-4'),
    // model: model(options.model || 'openai/o3', { structuredOutputs: true }),
    // model: model(options.model || 'openai/o4-mini-high', { structuredOutputs: true }),
    model: model(options.model || 'google/gemini-2.5-pro-preview', { structuredOutputs: true }),
    system: `You are an expert at scoping software development projects, and breaking down epics into discrete coding tasks. `,
    prompt: `Scope ${project}`,
    schema,
  })

  return result.object
})