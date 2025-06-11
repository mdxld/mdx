import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import type { Step, Workflow, WorkflowExecution } from '../workflow'

async function executeStep<TInput, TOutput>(step: Step<TInput, TOutput>, input: TInput): Promise<TOutput> {
  if (step.inputSchema) step.inputSchema.parse(input)
  const result = await step.execute?.(input)
  return step.outputSchema.parse(result)
}

describe('workflow utilities', () => {
  it('executes a step with schema validation', async () => {
    const step: Step<{ input: string }, { output: string }> = {
      id: 'step',
      name: 'Example',
      inputSchema: z.object({ input: z.string() }),
      outputSchema: z.object({ output: z.string() }),
      execute: async (value) => ({ output: value.input.toUpperCase() }),
    }

    const result = await executeStep(step, { input: 'test' })
    expect(result.output).toBe('TEST')
  })

  it('tracks workflow execution state', async () => {
    const step: Step<undefined, string> = {
      id: 's1',
      name: 'first',
      outputSchema: z.string(),
      execute: async () => 'done',
    }

    const workflow: Workflow<undefined, string> = {
      id: 'wf',
      name: 'wf',
      inputSchema: z.undefined(),
      outputSchema: z.string(),
      steps: [step],
    }

    const execution: WorkflowExecution<undefined, string> = {
      workflow,
      currentStepIndex: 0,
      stepResults: {},
      status: 'pending',
    }

    const output = await executeStep(workflow.steps[0], undefined)
    execution.stepResults[step.id] = output
    execution.currentStepIndex = 1
    execution.status = 'completed'

    expect(execution.stepResults[step.id]).toBe('done')
    expect(execution.status).toBe('completed')
  })
})
