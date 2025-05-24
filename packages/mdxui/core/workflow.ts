import { z } from 'zod'

/**
 * Represents a single step in a workflow
 * Input is optional as the first step might not have input
 * Output is required for all steps
 */
export interface Step<TInput = any, TOutput = any> {
  id: string
  name: string
  description?: string
  inputSchema?: z.ZodSchema<TInput>
  outputSchema: z.ZodSchema<TOutput>
  execute?: (input?: TInput) => Promise<TOutput> | TOutput
}

/**
 * Represents a complete workflow with multiple steps
 * A workflow has input and output schemas and a collection of steps
 */
export interface Workflow<TInput = any, TOutput = any> {
  id: string
  name: string
  description?: string
  inputSchema: z.ZodSchema<TInput>
  outputSchema: z.ZodSchema<TOutput>
  steps: Step[]
}

/**
 * Represents the execution state of a workflow
 * Tracks the current step, results from previous steps, and overall status
 */
export interface WorkflowExecution<TInput = any, TOutput = any> {
  workflow: Workflow<TInput, TOutput>
  currentStepIndex: number
  stepResults: Record<string, any>
  status: 'pending' | 'running' | 'completed' | 'failed'
  error?: Error
}
