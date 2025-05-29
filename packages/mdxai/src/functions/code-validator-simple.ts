import { z } from 'zod'
import * as ts from 'typescript'

/**
 * Result of code validation
 */
export interface CodeValidationResult {
  jsdoc: {
    valid: boolean
    errors: string[]
    parsed?: any
  }
  typescript: {
    valid: boolean
    errors: string[]
    diagnostics?: ts.Diagnostic[]
  }
  syntax: {
    valid: boolean
    errors: string[]
  }
}

/**
 * Parse and validate JSDoc comments from TypeScript code
 */
export function validateJSDoc(code: string): { valid: boolean; errors: string[]; parsed?: any } {
  try {
    // Create TypeScript source file to extract JSDoc
    const sourceFile = ts.createSourceFile(
      'temp.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    )

    const errors: string[] = []
    const jsdocComments: any[] = []

    function visit(node: ts.Node) {
      // Check for JSDoc comments on function declarations
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
        const jsDocTags = ts.getJSDocTags(node)
        const jsDocComments = ts.getJSDocCommentsAndTags(node)
        
        if (jsDocComments.length > 0) {
          jsDocComments.forEach(comment => {
            if (ts.isJSDoc(comment)) {
              const parsed = {
                comment: comment.comment,
                tags: comment.tags?.map(tag => ({
                  tagName: tag.tagName.text,
                  comment: tag.comment
                })) || []
              }
              jsdocComments.push(parsed)
            }
          })
        }
      }
      
      ts.forEachChild(node, visit)
    }

    visit(sourceFile)

    return {
      valid: errors.length === 0,
      errors,
      parsed: jsdocComments
    }
  } catch (error) {
    return {
      valid: false,
      errors: [`JSDoc parsing error: ${error instanceof Error ? error.message : String(error)}`]
    }
  }
}

/**
 * Validate TypeScript code syntax (basic syntax check, not full type checking)
 */
export function validateTypeScript(code: string): { valid: boolean; errors: string[]; diagnostics?: ts.Diagnostic[] } {
  try {
    // Create a TypeScript source file for syntax checking
    const sourceFile = ts.createSourceFile(
      'temp.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    )

    // Check for syntax errors - use getSourceFile().parseDiagnostics if available
    const syntaxDiagnostics: ts.Diagnostic[] = (sourceFile as any).parseDiagnostics || []
    const errors = syntaxDiagnostics.map((diagnostic: ts.Diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      if (diagnostic.file && diagnostic.start !== undefined) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
        return `Line ${line + 1}, Column ${character + 1}: ${message}`
      }
      return message
    })

    return {
      valid: errors.length === 0,
      errors,
      diagnostics: syntaxDiagnostics
    }
  } catch (error) {
    return {
      valid: false,
      errors: [`TypeScript validation error: ${error instanceof Error ? error.message : String(error)}`]
    }
  }
}

/**
 * Validate test code syntax (check if it looks like valid test code)
 */
export function validateTestSyntax(testCode: string): { valid: boolean; errors: string[] } {
  try {
    const errors: string[] = []
    
    // Basic checks for test structure
    if (!testCode.includes('describe') && !testCode.includes('it') && !testCode.includes('test')) {
      errors.push('Test code should contain describe, it, or test blocks')
    }
    
    if (!testCode.includes('expect')) {
      errors.push('Test code should contain expect assertions')
    }
    
    // Check for basic TypeScript syntax
    const tsResult = validateTypeScript(testCode)
    if (!tsResult.valid) {
      errors.push(...tsResult.errors.map(err => `Test syntax error: ${err}`))
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  } catch (error) {
    return {
      valid: false,
      errors: [`Test validation error: ${error instanceof Error ? error.message : String(error)}`]
    }
  }
}

/**
 * Validate the complete code generation result
 */
export function validateCodeResult(result: z.infer<typeof import('./code').schema>): CodeValidationResult {
  // Validate JSDoc
  const jsdocValidation = validateJSDoc(result.type + '\n' + result.code)
  
  // Validate TypeScript code
  const tsValidation = validateTypeScript(result.code)
  
  // Validate test syntax
  const testValidation = validateTestSyntax(result.tests)
  
  return {
    jsdoc: jsdocValidation,
    typescript: tsValidation,
    syntax: testValidation
  }
}

/**
 * Check if code contains common patterns
 */
export function analyzeCodePatterns(code: string): {
  hasExports: boolean
  hasFunctions: boolean
  hasTypes: boolean
  hasComments: boolean
} {
  return {
    hasExports: /export\s+(function|const|class|interface|type)/.test(code),
    hasFunctions: /(function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{)/.test(code),
    hasTypes: /:\s*(string|number|boolean|object|\w+\[\])/.test(code),
    hasComments: /\/\*\*[\s\S]*?\*\/|\/\//.test(code)
  }
} 