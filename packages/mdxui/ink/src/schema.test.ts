import { describe, it, expect } from 'vitest';
import { createSchemaFromFrontmatter } from './schema';

describe('schema', () => {
  it('should create a zod schema from frontmatter', () => {
    const frontmatter = {
      input: {
        name: 'string',
        os: 'enum[Ubuntu, Debian]',
        memory: 'number',
        region: 'enum[iad,sfo,lhr]'
      }
    };

    const schema = createSchemaFromFrontmatter(frontmatter);
    expect(schema).toBeDefined();
    expect(schema.inputSchema).toBeDefined();
    
    const validData = {
      name: 'test-project',
      os: 'Ubuntu',
      memory: 1024,
      region: 'sfo'
    };
    
    const result = schema.inputSchema!.safeParse(validData);
    expect(result.success).toBe(true);
    
    const invalidData = {
      name: 'test-project',
      os: 'Windows', // Invalid enum value
      memory: 1024,
      region: 'sfo'
    };
    
    const invalidResult = schema.inputSchema!.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
  });
});
