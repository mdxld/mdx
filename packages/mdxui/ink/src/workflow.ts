import { z } from 'zod';
import { createZodType } from './schema';
import { WorkflowFrontmatter } from './types';

interface Step<TInput = any, TOutput = any> {
  id: string;
  name: string;
  description?: string;
  inputSchema?: z.ZodSchema<TInput>;
  outputSchema: z.ZodSchema<TOutput>;
  execute?: (input?: TInput) => Promise<TOutput> | TOutput;
}

interface Workflow<TInput = any, TOutput = any> {
  id: string;
  name: string;
  description?: string;
  inputSchema: z.ZodSchema<TInput>;
  outputSchema: z.ZodSchema<TOutput>;
  steps: Step[];
}

interface WorkflowExecution<TInput = any, TOutput = any> {
  workflow: Workflow<TInput, TOutput>;
  currentStepIndex: number;
  stepResults: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: Error;
}

/**
 * Creates a Workflow object from MDX frontmatter
 */
export function createWorkflowFromFrontmatter(frontmatter: WorkflowFrontmatter): Workflow | null {
  if (!frontmatter.workflow) return null;

  const steps: Step[] = frontmatter.workflow.steps.map(stepDef => ({
    id: stepDef.id,
    name: stepDef.name,
    description: stepDef.description,
    inputSchema: stepDef.input ? createSchemaFromDefinition(stepDef.input) : undefined,
    outputSchema: createSchemaFromDefinition(stepDef.output)
  }));

  const inputSchema = steps[0]?.inputSchema || z.any();
  const outputSchema = steps[steps.length - 1]?.outputSchema || z.any();

  return {
    id: frontmatter.workflow.id,
    name: frontmatter.workflow.name,
    description: frontmatter.workflow.description,
    inputSchema,
    outputSchema,
    steps
  };
}

/**
 * Creates a Zod schema from a string-based type definition
 */
function createSchemaFromDefinition(definition: Record<string, string>) {
  const schemaObj: Record<string, z.ZodTypeAny> = {};
  Object.entries(definition).forEach(([key, type]) => {
    schemaObj[key] = createZodType(type);
  });
  return z.object(schemaObj);
}

/**
 * Executes a single workflow step
 */
export async function executeWorkflowStep(
  step: Step,
  input?: any,
  previousResults?: Record<string, any>
): Promise<any> {
  if (step.inputSchema && input !== undefined) {
    step.inputSchema.parse(input);
  }

  if (!step.execute) {
    return generateMockOutput(step.outputSchema);
  }

  const result = await step.execute(input);
  step.outputSchema.parse(result);
  return result;
}

/**
 * Generates mock output data based on a Zod schema
 */
function generateMockOutput(schema: z.ZodSchema): any {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const mock: Record<string, any> = {};
    Object.entries(shape).forEach(([key, fieldSchema]) => {
      if (fieldSchema instanceof z.ZodString) {
        mock[key] = `mock-${key}`;
      } else if (fieldSchema instanceof z.ZodNumber) {
        mock[key] = 42;
      } else if (fieldSchema instanceof z.ZodArray) {
        mock[key] = [`mock-${key}-item-1`, `mock-${key}-item-2`];
      } else {
        mock[key] = `mock-${key}`;
      }
    });
    return mock;
  }
  return 'mock-output';
}
