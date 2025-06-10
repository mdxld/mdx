import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'
import fs from 'node:fs/promises'
import path from 'node:path'
import { globby } from 'globby'
import { ExecutionContextType } from './execution-context'
import * as acorn from 'acorn'
import * as acornJsx from 'acorn-jsx'

/**
 * Represents a code block extracted from MDX content
 */
export interface CodeBlock {
  lang: string
  meta: string | null
  value: string
}

/**
 * Represents a function extracted from code blocks
 */
export interface ExtractedFunction {
  name: string
  params: string[]
  body: string
  type: 'function' | 'arrow' | 'method'
  isAsync: boolean
  isExported: boolean
  sourceFile: string
  codeBlock: CodeBlock
}

/**
 * Extract execution context from code block metadata
 */
export function extractExecutionContext(meta: string | null): ExecutionContextType {
  if (!meta) return 'default'

  if (meta.includes('test')) return 'test'
  if (meta.includes('dev')) return 'dev'
  if (meta.includes('production')) return 'production'

  return 'default'
}

/**
 * Extract code blocks from MDX content
 */
export function extractCodeBlocks(mdxContent: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = []

  const tree = unified().use(remarkParse).use(remarkMdx).parse(mdxContent)

  visit(tree, 'code', (node: any) => {
    codeBlocks.push({
      lang: node.lang || '',
      meta: node.meta || null,
      value: node.value || '',
    })
  })

  return codeBlocks
}

/**
 * Find all MDX files in a directory
 */
export async function findMdxFiles(dir: string): Promise<string[]> {
  try {
    const files = await globby(['**/*.md', '**/*.mdx'], {
      cwd: dir,
      absolute: true,
    })

    const filteredFiles = files.filter((file) => {
      return !file.includes('/node_modules/') && !file.includes('/dist/') && !file.includes('/build/') && !file.includes('/.git/')
    })

    return filteredFiles
  } catch (error) {
    console.error('Error finding MDX files:', error)
    return []
  }
}

/**
 * Extract testing and non-testing code blocks from an MDX file
 */
export async function extractMdxCodeBlocks(filePath: string): Promise<{
  testBlocks: CodeBlock[]
  codeBlocks: CodeBlock[]
}> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const blocks = extractCodeBlocks(content)

    const testBlocks = blocks.filter(
      (block) => (block.lang === 'typescript' || block.lang === 'ts' || block.lang === 'js' || block.lang === 'javascript') && block.meta?.includes('test'),
    )

    const codeBlocks = blocks.filter(
      (block) => (block.lang === 'typescript' || block.lang === 'ts' || block.lang === 'js' || block.lang === 'javascript') && !block.meta?.includes('test'),
    )

    return { testBlocks, codeBlocks }
  } catch (error) {
    console.error(`Error extracting code blocks from ${filePath}:`, error)
    return { testBlocks: [], codeBlocks: [] }
  }
}

/**
 * Local implementation of parseCodeBlocksWithEstree to avoid mdxld CLI import issues
 */
interface CodeBlockWithEstree {
  lang: string
  meta: string | null
  value: string
  estree?: any
  error?: string
}

function parseCodeBlocksWithEstree(mdxContent: string): CodeBlockWithEstree[] {
  try {
    const codeBlocks: CodeBlockWithEstree[] = []
    const processor = unified().use(remarkParse).use(remarkMdx)
    const tree = processor.parse(mdxContent)

    const parser = acorn.Parser.extend(acornJsx.default())

    visit(tree, 'code', (node: any) => {
      const codeBlock: CodeBlockWithEstree = {
        lang: node.lang || '',
        meta: node.meta || null,
        value: node.value || '',
      }

      if (['js', 'jsx', 'javascript', 'ts', 'tsx', 'typescript'].includes(node.lang)) {
        try {
          const estree = parser.parse(node.value, {
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

          codeBlock.estree = estree
        } catch (e: any) {
          codeBlock.error = `Code block parsing error: ${e.message}`
        }
      }

      codeBlocks.push(codeBlock)
    })

    return codeBlocks
  } catch (e: any) {
    return [
      {
        lang: '',
        meta: null,
        value: '',
        error: `MDXLD Code Block Parsing Error: ${e.message}`,
      },
    ]
  }
}

/**
 * Extract functions from code blocks using AST traversal
 */
export function extractFunctionsFromCodeBlocks(codeBlocks: CodeBlock[], sourceFile: string): ExtractedFunction[] {
  const functions: ExtractedFunction[] = []

  for (const codeBlock of codeBlocks) {
    if (!['typescript', 'ts', 'javascript', 'js'].includes(codeBlock.lang)) {
      continue
    }

    try {
      const codeBlocksWithEstree = parseCodeBlocksWithEstree(`\`\`\`${codeBlock.lang} ${codeBlock.meta || ''}\n${codeBlock.value}\n\`\`\``)
      
      for (const blockWithEstree of codeBlocksWithEstree) {
        if (blockWithEstree.estree && !blockWithEstree.error) {
          const astFunctions = extractFunctionsFromAST(blockWithEstree.estree, codeBlock, sourceFile)
          functions.push(...astFunctions)
        }
      }
    } catch (error) {
      console.error(`Error parsing code block in ${sourceFile}:`, error)
    }
  }

  return functions
}

/**
 * Extract functions from an AST node
 */
function extractFunctionsFromAST(ast: any, codeBlock: CodeBlock, sourceFile: string): ExtractedFunction[] {
  const functions: ExtractedFunction[] = []

  function traverse(node: any, isExported = false) {
    if (!node || typeof node !== 'object') return

    switch (node.type) {
      case 'FunctionDeclaration':
        if (node.id && node.id.name) {
          functions.push({
            name: node.id.name,
            params: node.params.map((param: any) => getParamName(param)),
            body: codeBlock.value.slice(node.start, node.end),
            type: 'function',
            isAsync: node.async || false,
            isExported,
            sourceFile,
            codeBlock
          })
        }
        break

      case 'VariableDeclaration':
        for (const declarator of node.declarations || []) {
          if (declarator.id && declarator.id.name && declarator.init) {
            if (declarator.init.type === 'ArrowFunctionExpression' || declarator.init.type === 'FunctionExpression') {
              functions.push({
                name: declarator.id.name,
                params: declarator.init.params.map((param: any) => getParamName(param)),
                body: codeBlock.value.slice(declarator.start, declarator.end),
                type: declarator.init.type === 'ArrowFunctionExpression' ? 'arrow' : 'function',
                isAsync: declarator.init.async || false,
                isExported,
                sourceFile,
                codeBlock
              })
            }
          }
        }
        break

      case 'MethodDefinition':
        if (node.key && node.key.name && node.value) {
          functions.push({
            name: node.key.name,
            params: node.value.params.map((param: any) => getParamName(param)),
            body: codeBlock.value.slice(node.start, node.end),
            type: 'method',
            isAsync: node.value.async || false,
            isExported,
            sourceFile,
            codeBlock
          })
        }
        break

      case 'ExportNamedDeclaration':
      case 'ExportDefaultDeclaration':
        if (node.declaration) {
          traverse(node.declaration, true)
        }
        break
    }

    for (const key in node) {
      if (key !== 'parent' && node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          for (const child of node[key]) {
            traverse(child, isExported)
          }
        } else {
          traverse(node[key], isExported)
        }
      }
    }
  }

  traverse(ast)
  return functions
}

/**
 * Get parameter name from AST node
 */
function getParamName(param: any): string {
  if (!param) return ''
  
  switch (param.type) {
    case 'Identifier':
      return param.name
    case 'RestElement':
      return `...${getParamName(param.argument)}`
    case 'AssignmentPattern':
      return `${getParamName(param.left)} = ${param.right.raw || 'default'}`
    case 'ObjectPattern':
      return `{${param.properties.map((prop: any) => prop.key?.name || '').join(', ')}}`
    case 'ArrayPattern':
      return `[${param.elements.map((elem: any) => getParamName(elem)).join(', ')}]`
    default:
      return param.name || ''
  }
}

/**
 * Extract all functions from an MDX file
 */
export async function extractFunctionsFromMdxFile(filePath: string): Promise<ExtractedFunction[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const codeBlocks = extractCodeBlocks(content)
    return extractFunctionsFromCodeBlocks(codeBlocks, filePath)
  } catch (error) {
    console.error(`Error extracting functions from ${filePath}:`, error)
    return []
  }
}

/**
 * Extract all functions from all MDX files in a directory
 */
export async function extractAllFunctions(dir: string): Promise<ExtractedFunction[]> {
  const files = await findMdxFiles(dir)
  const allFunctions: ExtractedFunction[] = []

  for (const file of files) {
    const functions = await extractFunctionsFromMdxFile(file)
    allFunctions.push(...functions)
  }

  return allFunctions
}
