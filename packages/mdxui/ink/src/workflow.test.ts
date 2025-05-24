import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { createWorkflowFromFrontmatter, executeWorkflowStep } from './workflow'
import type { WorkflowFrontmatter } from './types'

describe('Workflow creation and execution', () => {
  it('should create workflow from frontmatter', () => {
    const frontmatter: WorkflowFrontmatter = {
      workflow: {
        id: 'test-workflow',
        name: 'Test Workflow',
        description: 'A test workflow',
        steps: [
          {
            id: 'step1',
            name: 'First Step',
            input: { name: 'string' },
            output: { result: 'string' }
          }
        ]
      }
    }

    const workflow = createWorkflowFromFrontmatter(frontmatter)
    expect(workflow).toBeDefined()
    expect(workflow!.id).toBe('test-workflow')
    expect(workflow!.steps).toHaveLength(1)
    expect(workflow!.steps[0].id).toBe('step1')
  })

  it('should execute workflow step with mock data', async () => {
    const step = {
      id: 'test-step',
      name: 'Test Step',
      outputSchema: z.object({ result: z.string() })
    }

    const result = await executeWorkflowStep(step)
    expect(result).toBeDefined()
    expect(typeof result.result).toBe('string')
  })

  it('should handle startup workflow frontmatter', () => {
    const startupFrontmatter: WorkflowFrontmatter = {
      workflow: {
        id: 'startup-launch',
        name: 'Startup Launch Workflow',
        steps: [
          {
            id: 'idea-input',
            name: 'Initial Idea',
            output: { idea: 'string', industry: 'string' }
          },
          {
            id: 'refine-icp',
            name: 'Define ICP',
            input: { idea: 'string', industry: 'string' },
            output: { icp_demographics: 'string', pain_points: 'array' }
          }
        ]
      }
    }

    const workflow = createWorkflowFromFrontmatter(startupFrontmatter)
    expect(workflow).toBeDefined()
    expect(workflow!.steps).toHaveLength(2)
  })
})
