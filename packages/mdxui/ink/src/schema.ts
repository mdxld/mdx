import { z } from 'zod';
import { MdxFrontmatter } from './types';

/**
 * Create Zod schemas from frontmatter input/output definitions
 */
export function createSchemaFromFrontmatter(frontmatter: MdxFrontmatter) {
  const inputSchema = frontmatter.input ? createInputSchema(frontmatter.input) : undefined;
  const outputSchema = frontmatter.output ? createOutputSchema(frontmatter.output) : undefined;
  
  return { inputSchema, outputSchema };
}

/**
 * Create a Zod schema from input definitions
 */
function createInputSchema(input: Record<string, string>) {
  const schemaObj: Record<string, z.ZodTypeAny> = {};
  
  Object.entries(input).forEach(([key, type]) => {
    schemaObj[key] = createZodType(type);
  });
  
  return z.object(schemaObj);
}

/**
 * Create a Zod schema from output definitions
 */
function createOutputSchema(output: Record<string, string>) {
  const schemaObj: Record<string, z.ZodTypeAny> = {};
  
  Object.entries(output).forEach(([key, type]) => {
    schemaObj[key] = createZodType(type);
  });
  
  return z.object(schemaObj);
}

/**
 * Create a Zod type from a string type definition
 */
export function createZodType(type: string): z.ZodTypeAny {
  if (type === 'string') {
    return z.string();
  }
  
  if (type === 'number') {
    return z.number();
  }
  
  if (type === 'boolean') {
    return z.boolean();
  }
  
  if (type === 'array') {
    return z.array(z.any());
  }
  
  if (type === 'object') {
    return z.record(z.any());
  }
  
  if (type.startsWith('enum[')) {
    const options = type
      .replace('enum[', '')
      .replace(']', '')
      .split(',')
      .map(o => o.trim());
    return z.enum(options as [string, ...string[]]);
  }
  
  return z.string();
}
