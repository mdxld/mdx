// Test script for AI functions
import { ai } from './packages/mdxai/dist/index.js';

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test';

console.log('Environment:', process.env.NODE_ENV);

async function runTests() {
  console.log('Testing AI functions...');
  
  try {
    // Test string output (default.md)
    console.log('\n--- Testing string output ---');
    const stringResult = await ai`Write a short paragraph about JavaScript`;
    console.log('String result type:', typeof stringResult);
    console.log('String result preview:', stringResult ? (stringResult.substring(0, 100) + '...') : 'No result');
    
    // Test array output (list.md)
    console.log('\n--- Testing array output ---');
    const arrayResult = await ai.list`Generate 3 ideas for blog posts about React`;
    console.log('Array result type:', Array.isArray(arrayResult));
    console.log('Array result length:', arrayResult ? arrayResult.length : 0);
    console.log('Array result preview:', arrayResult);
    
    // Test object output (storyBrand.md)
    console.log('\n--- Testing object output ---');
    const objectResult = await ai.storyBrand({ brand: 'Vercel' });
    console.log('Object result type:', typeof objectResult);
    console.log('Object keys:', objectResult ? Object.keys(objectResult) : []);
    console.log('Object result preview:', objectResult ? JSON.stringify(objectResult, null, 2) : 'No result');
    
    if (objectResult) {
      // Test enum parsing
      console.log('\n--- Testing enum parsing ---');
      console.log('Tone enum value:', objectResult.tone);
      console.log('Status enum value:', objectResult.status);
    }
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during tests:', error);
    console.error(error.stack);
  }
}

runTests();
