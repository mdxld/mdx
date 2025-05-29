import { createVitest } from 'vitest/node'
import { z } from 'zod'
import * as ts from 'typescript'
import { parseCodeBlocksWithEstree } from 'mdxld'

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
  tests: {
    valid: boolean
    errors: string[]
    results?: any
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
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
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
 * Validate TypeScript code syntax and types
 */
export function validateTypeScript(code: string): { valid: boolean; errors: string[]; diagnostics?: ts.Diagnostic[] } {
  try {
    // Create a TypeScript program to check the code
    const sourceFile = ts.createSourceFile(
      'temp.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    )

    // Create a simple program for type checking
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      strict: true,
      noEmit: true,
      skipLibCheck: true
    }

    const program = ts.createProgram(['temp.ts'], compilerOptions, {
      getSourceFile: (fileName) => fileName === 'temp.ts' ? sourceFile : undefined,
      writeFile: () => {},
      getCurrentDirectory: () => '',
      getDirectories: () => [],
      fileExists: () => true,
      readFile: () => '',
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n'
    })

    const diagnostics = ts.getPreEmitDiagnostics(program)
    const errors = diagnostics.map(diagnostic => {
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
      diagnostics
    }
  } catch (error) {
    return {
      valid: false,
      errors: [`TypeScript validation error: ${error instanceof Error ? error.message : String(error)}`]
    }
  }
}

/**
 * Run Vitest tests programmatically from test code string
 */
export async function runVitestFromString(
  testCode: string,
  setupCode?: string
): Promise<{ valid: boolean; errors: string[]; results?: any }> {
  try {
    // Create a virtual test module
    const fullTestCode = `
${setupCode || ''}

import { describe, it, expect, vi } from 'vitest'

${testCode}
`

    // Create Vitest instance
    const vitest = await createVitest('test', {
      // Configure Vitest to run without file system
      config: {
        test: {
          globals: true,
          environment: 'node',
          pool: 'forks',
          poolOptions: {
            forks: {
              singleFork: true
            }
          }
        }
      }
    })

    // Create a virtual module resolver
    const originalResolveId = vitest.vite.pluginContainer.resolveId
    vitest.vite.pluginContainer.resolveId = async function(id, importer, options) {
      if (id === 'virtual:test-module') {
        return { id: 'virtual:test-module' }
      }
      return originalResolveId.call(this, id, importer, options)
    }

    const originalLoad = vitest.vite.pluginContainer.load
    vitest.vite.pluginContainer.load = async function(id, options) {
      if (id === 'virtual:test-module') {
        return { code: fullTestCode }
      }
      return originalLoad.call(this, id, options)
    }

    // Create test specification for the virtual module
    const project = vitest.projects[0]
    const spec = project.createSpecification('virtual:test-module')

    // Run the test
    const result = await vitest.runTestSpecifications([spec])

    await vitest.close()

    const hasFailures = result.state.getFiles().some(file => 
      file.result?.state === 'fail' || file.tasks.some(task => task.result?.state === 'fail')
    )

    const errors: string[] = []
    if (hasFailures) {
      result.state.getFiles().forEach(file => {
        if (file.result?.errors) {
          file.result.errors.forEach(error => {
            errors.push(error.message || String(error))
          })
        }
        file.tasks.forEach(task => {
          if (task.result?.errors) {
            task.result.errors.forEach(error => {
              errors.push(error.message || String(error))
            })
          }
        })
      })
    }

    return {
      valid: !hasFailures,
      errors,
      results: result.state.getFiles()
    }
  } catch (error) {
    return {
      valid: false,
      errors: [`Vitest execution error: ${error instanceof Error ? error.message : String(error)}`]
    }
  }
}

/**
 * Validate the complete code generation result
 */
export async function validateCodeResult(result: z.infer<typeof import('./code').schema>): Promise<CodeValidationResult> {
  // Validate JSDoc
  const jsdocValidation = validateJSDoc(result.type + '\n' + result.code)
  
  // Validate TypeScript code
  const tsValidation = validateTypeScript(result.code)
  
  // Run tests
  const testValidation = await runVitestFromString(result.tests, result.code)
  
  return {
    jsdoc: jsdocValidation,
    typescript: tsValidation,
    tests: testValidation
  }
} 