import * as ts from 'typescript'

/**
 * Validate TypeScript code syntax using TypeScript compiler
 */
export function validateTypeScript(code: string): { 
  valid: boolean;
  error?: string;
  estree?: any;
} {
  try {
    const sourceFile = ts.createSourceFile(
      'temp.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    )

    const syntaxDiagnostics: ts.Diagnostic[] = (sourceFile as any).parseDiagnostics || []
    if (syntaxDiagnostics.length > 0) {
      const errors = syntaxDiagnostics.map((diagnostic: ts.Diagnostic) => {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        if (diagnostic.file && diagnostic.start !== undefined) {
          const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
          return `Line ${line + 1}, Column ${character + 1}: ${message}`
        }
        return message
      })
      return { valid: false, error: errors.join('\n') }
    }
    
    const estree = {
      type: 'Program',
      body: [],
      sourceType: 'module',
      comments: [],
      tokens: [],
      range: [0, code.length],
      loc: {
        start: { line: 1, column: 0 },
        end: { line: code.split('\n').length, column: 0 }
      }
    }
    
    return { valid: true, estree }
  } catch (e: any) {
    return { valid: false, error: `TypeScript validation error: ${e.message}` }
  }
}
