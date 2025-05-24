import { describe, it, expect } from 'vitest';
import { createZodSchemaFromFrontmatter } from './schema';

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

    const schema = createZodSchemaFromFrontmatter(frontmatter);
    expect(schema).toBeDefined();
    
    const validData = {
      name: 'test-project',
      os: 'Ubuntu',
      memory: 1024,
      region: 'sfo'
    };
    
    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
    
    const invalidData = {
      name: 'test-project',
      os: 'Windows', // Invalid enum value
      memory: 1024,
      region: 'sfo'
    };
    
    const invalidResult = schema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
  });
});
