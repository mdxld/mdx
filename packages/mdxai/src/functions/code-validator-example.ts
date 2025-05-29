import { codeWithValidation } from './code'
import { analyzeCodePatterns } from './code-validator-simple'

/**
 * Example usage of the code generation with validation
 */
async function example() {
  try {
    // Generate code with validation
    const result = await codeWithValidation`a function that calculates the factorial of a number`
    
    console.log('Generated Function:', result.functionName)
    console.log('Description:', result.description)
    console.log('\nJSDoc:')
    console.log(result.type)
    console.log('\nCode:')
    console.log(result.code)
    console.log('\nTests:')
    console.log(result.tests)
    
    if (result.validation) {
      console.log('\n=== VALIDATION RESULTS ===')
      
      console.log('\nJSDoc Validation:')
      console.log('Valid:', result.validation.jsdoc.valid)
      if (!result.validation.jsdoc.valid) {
        console.log('Errors:', result.validation.jsdoc.errors)
      } else {
        console.log('Parsed JSDoc comments:', result.validation.jsdoc.parsed?.length || 0)
      }
      
      console.log('\nTypeScript Validation:')
      console.log('Valid:', result.validation.typescript.valid)
      if (!result.validation.typescript.valid) {
        console.log('Errors:', result.validation.typescript.errors)
      }
      
      console.log('\nTest Syntax Validation:')
      console.log('Valid:', result.validation.syntax.valid)
      if (!result.validation.syntax.valid) {
        console.log('Errors:', result.validation.syntax.errors)
      }
      
      // Overall validation status
      const allValid = result.validation.jsdoc.valid && 
                      result.validation.typescript.valid && 
                      result.validation.syntax.valid
      
      console.log('\n=== OVERALL STATUS ===')
      console.log('All validations passed:', allValid)
      
      // Analyze code patterns
      console.log('\n=== CODE ANALYSIS ===')
      const codePatterns = analyzeCodePatterns(result.code)
      const testPatterns = analyzeCodePatterns(result.tests)
      
      console.log('Code patterns:')
      console.log('- Has exports:', codePatterns.hasExports)
      console.log('- Has functions:', codePatterns.hasFunctions)
      console.log('- Has types:', codePatterns.hasTypes)
      console.log('- Has comments:', codePatterns.hasComments)
      
      console.log('\nTest patterns:')
      console.log('- Has exports:', testPatterns.hasExports)
      console.log('- Has functions:', testPatterns.hasFunctions)
      console.log('- Has types:', testPatterns.hasTypes)
      console.log('- Has comments:', testPatterns.hasComments)
    }
    
  } catch (error) {
    console.error('Error generating code:', error)
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  example()
}

export { example } 