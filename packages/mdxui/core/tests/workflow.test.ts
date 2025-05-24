import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import type { Step, Workflow } from '../workflow'

describe('Workflow interfaces', () => {
  it('should define Step interface correctly', () => {
    const step: Step = {
      id: 'test-step',
      name: 'Test Step',
      description: 'A test step',
      inputSchema: z.object({ input: z.string() }),
      outputSchema: z.object({ output: z.string() })
    }
    
    expect(step.id).toBe('test-step')
    expect(step.name).toBe('Test Step')
    expect(step.inputSchema).toBeDefined()
    expect(step.outputSchema).toBeDefined()
  })

  it('should define Workflow interface correctly', () => {
    const workflow: Workflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      inputSchema: z.object({ start: z.string() }),
      outputSchema: z.object({ end: z.string() }),
      steps: []
    }
    
    expect(workflow.id).toBe('test-workflow')
    expect(workflow.steps).toEqual([])
  })
})
