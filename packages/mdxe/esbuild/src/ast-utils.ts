import * as acorn from 'acorn'
import * as acornJsx from 'acorn-jsx'
import { EnhancedCodeBlock } from './types'

export function analyzeCodeBlock(codeBlock: EnhancedCodeBlock): EnhancedCodeBlock {
  if (!['js', 'jsx', 'javascript', 'ts', 'tsx', 'typescript'].includes(codeBlock.lang)) {
    return codeBlock
  }

  try {
    const parser = acorn.Parser.extend(acornJsx.default())
    const estree = parser.parse(codeBlock.value, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
      allowImportExportEverywhere: true,
      allowReserved: true,
      allowReturnOutsideFunction: true,
      allowSuperOutsideMethod: true,
      allowHashBang: true,
      locations: true,
    } as any)

    let hasStatements = false
    let hasDeclarations = false
    const declarations: string[] = []

    if (estree.body && Array.isArray(estree.body)) {
      for (const statement of estree.body) {
        if (statement.type === 'VariableDeclaration') {
          hasDeclarations = true
          for (const decl of statement.declarations) {
            if (decl.id && decl.id.type === 'Identifier') {
              declarations.push(decl.id.name)
            }
          }
        } else if (statement.type === 'FunctionDeclaration' && statement.id) {
          hasDeclarations = true
          declarations.push(statement.id.name)
        } else if (
          statement.type !== 'ImportDeclaration' && 
          statement.type !== 'ExportNamedDeclaration' && 
          statement.type !== 'ExportDefaultDeclaration'
        ) {
          hasStatements = true
        }
        
        if (
          statement.type === 'ExportNamedDeclaration' ||
          statement.type === 'ExportDefaultDeclaration'
        ) {
          codeBlock.isExported = true
        }
      }
    }

    codeBlock.declarations = declarations
    
    if (hasStatements && hasDeclarations) {
      codeBlock.type = 'mixed'
    } else if (hasDeclarations) {
      codeBlock.type = 'declaration'
    } else {
      codeBlock.type = 'statement'
    }
    
    return codeBlock
  } catch (e) {
    return { ...codeBlock, type: 'statement' }
  }
}

export function toCamelCase(text: string): string {
  if (/^\d+[A-Z]/.test(text)) {
    return text.replace(/[^a-zA-Z0-9]/g, '')
  }
  
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
}
