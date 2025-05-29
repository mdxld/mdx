#!/usr/bin/env node

import { codeWithValidation } from './code.js'

/**
 * Demo of code generation with validation
 */
async function demo() {
  console.log('🚀 MDX AI Code Generation with Validation Demo\n')
  
  try {
    // Generate code with validation
    console.log('Generating code for: "a function that calculates the factorial of a number"')
    console.log('⏳ Generating...\n')
    
    const result = await codeWithValidation`a function that calculates the factorial of a number`
    
    console.log('✅ Code generated successfully!\n')
    console.log('📝 Function Name:', result.functionName)
    console.log('📄 Description:', result.description)
    
    console.log('\n📋 Generated JSDoc:')
    console.log('```typescript')
    console.log(result.type)
    console.log('```')
    
    console.log('\n💻 Generated Code:')
    console.log('```typescript')
    console.log(result.code)
    console.log('```')
    
    console.log('\n🧪 Generated Tests:')
    console.log('```typescript')
    console.log(result.tests)
    console.log('```')
    
    if (result.validation) {
      console.log('\n🔍 VALIDATION RESULTS:')
      console.log('=' .repeat(50))
      
      // JSDoc validation
      console.log('\n📚 JSDoc Validation:')
      if (result.validation.jsdoc.valid) {
        console.log('  ✅ Valid JSDoc structure')
        console.log(`  📊 Found ${result.validation.jsdoc.parsed?.length || 0} JSDoc comments`)
      } else {
        console.log('  ❌ JSDoc validation failed:')
        result.validation.jsdoc.errors.forEach(error => {
          console.log(`    • ${error}`)
        })
      }
      
      // TypeScript validation
      console.log('\n🔧 TypeScript Syntax Validation:')
      if (result.validation.typescript.valid) {
        console.log('  ✅ Valid TypeScript syntax')
      } else {
        console.log('  ❌ TypeScript validation failed:')
        result.validation.typescript.errors.forEach(error => {
          console.log(`    • ${error}`)
        })
      }
      
      // Test syntax validation
      console.log('\n🧪 Test Structure Validation:')
      if (result.validation.syntax.valid) {
        console.log('  ✅ Valid test structure')
      } else {
        console.log('  ❌ Test validation failed:')
        result.validation.syntax.errors.forEach(error => {
          console.log(`    • ${error}`)
        })
      }
      
      // Overall status
      const allValid = result.validation.jsdoc.valid && 
                      result.validation.typescript.valid && 
                      result.validation.syntax.valid
      
      console.log('\n🎯 OVERALL STATUS:')
      if (allValid) {
        console.log('  🎉 All validations passed! Code is ready to use.')
      } else {
        console.log('  ⚠️  Some validations failed. Review the errors above.')
      }
      
      console.log('\n📊 CODE ANALYSIS:')
      console.log('=' .repeat(50))
      
      // Import the analyzer
      const { analyzeCodePatterns } = await import('./code-validator-simple.js')
      
      const codePatterns = analyzeCodePatterns(result.code)
      const testPatterns = analyzeCodePatterns(result.tests)
      
      console.log('\n📝 Generated Code Patterns:')
      console.log(`  • Has exports: ${codePatterns.hasExports ? '✅' : '❌'}`)
      console.log(`  • Has functions: ${codePatterns.hasFunctions ? '✅' : '❌'}`)
      console.log(`  • Has type annotations: ${codePatterns.hasTypes ? '✅' : '❌'}`)
      console.log(`  • Has comments: ${codePatterns.hasComments ? '✅' : '❌'}`)
      
      console.log('\n🧪 Generated Test Patterns:')
      console.log(`  • Has exports: ${testPatterns.hasExports ? '✅' : '❌'}`)
      console.log(`  • Has functions: ${testPatterns.hasFunctions ? '✅' : '❌'}`)
      console.log(`  • Has type annotations: ${testPatterns.hasTypes ? '✅' : '❌'}`)
      console.log(`  • Has comments: ${testPatterns.hasComments ? '✅' : '❌'}`)
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('🎯 NEXT STEPS:')
    console.log('1. Copy the generated code to your project')
    console.log('2. Copy the tests to your test files')
    console.log('3. Run the tests with: pnpm test')
    console.log('4. The code is validated and ready to use!')
    
  } catch (error) {
    console.error('❌ Error generating code:', error)
    process.exit(1)
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo()
}

export { demo } 