#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a schema for testing - this demonstrates the Zod validation
const schema = z.object({
  name: z.string(),
  os: z.enum(['Ubuntu', 'Debian']),
  memory: z.number(),
  region: z.enum(['iad', 'sfo', 'lhr'])
});

async function main() {
  try {
    // Test data
    const testData = {
      name: 'test-project',
      os: 'Ubuntu',
      memory: 1024,
      region: 'sfo'
    };
    
    // Validate with Zod - this is what our library will do with frontmatter input
    const validatedData = schema.parse(testData);
    console.log('Zod validation successful!');
    console.log('Validated data:', validatedData);
    
    // Test invalid data
    try {
      const invalidData = {
        name: 'test-project',
        os: 'Windows', // Invalid enum value
        memory: 'not-a-number', // Invalid type
        region: 'nyc' // Invalid enum value
      };
      
      schema.parse(invalidData);
      console.error('Error: Invalid data passed validation!');
      process.exit(1);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.log('\nZod validation correctly rejected invalid data:');
        console.log(validationError.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n'));
      }
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:');
      console.error(error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n'));
    } else {
      console.error('Error testing schema validation:', error);
    }
    process.exit(1);
  }
}

main();
