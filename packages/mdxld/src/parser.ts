import { parse } from 'yaml'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'
import * as acorn from 'acorn'
import * as acornJsx from 'acorn-jsx'

export interface ParseFrontmatterResult {
  frontmatter: Record<string, any> | null
  error?: string
}

export interface ParseMdxResult {
  mdast: any
  simplifiedMdast: any
  frontmatter: Record<string, any> | null
  error?: string
}

export interface CodeBlockWithEstree {
  lang: string
  meta: string | null
  value: string
  estree?: any
  error?: string
}

export interface ImportsExportsResult {
  imports: any[]
  exports: any[]
  error?: string
}

/**
 * Parse code blocks from MDX content and generate estree AST for JavaScript/TypeScript blocks
 * @param mdxContent MDX content to parse
 * @returns Array of code blocks with estree AST for JS/TS blocks
 */
export function parseCodeBlocksWithEstree(mdxContent: string): CodeBlockWithEstree[] {
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
 * Parse imports and exports from MDX content
 * @param mdxContent MDX content to parse
 * @returns Object containing arrays of imports and exports
 */
export function parseImportsExports(mdxContent: string): ImportsExportsResult {
  try {
    const imports: any[] = []
    const exports: any[] = []
    const processor = unified().use(remarkParse).use(remarkMdx)
    const tree = processor.parse(mdxContent)

    const parser = acorn.Parser.extend(acornJsx.default())

    visit(tree, ['mdxjsEsm', 'mdxFlowExpression'], (node: any) => {
      if (node.type === 'mdxjsEsm') {
        try {
          const estree = parser.parse(node.value, {
            ecmaVersion: 'latest',
            sourceType: 'module',
            allowImportExportEverywhere: true,
            locations: true,
          })

          if (estree.body && Array.isArray(estree.body)) {
            for (const statement of estree.body) {
              if (statement.type === 'ImportDeclaration') {
                imports.push(statement)
              } else if (
                statement.type === 'ExportNamedDeclaration' ||
                statement.type === 'ExportDefaultDeclaration' ||
                statement.type === 'ExportAllDeclaration'
              ) {
                exports.push(statement)
              }
            }
          }
        } catch (e: any) {
          // If parsing fails, log the error but continue processing
          console.error(`Error parsing ESM node: ${e.message}`)
        }
      } else if (node.type === 'mdxFlowExpression') {
        try {
          const estree = parser.parse(node.value, {
            ecmaVersion: 'latest',
            sourceType: 'module',
            allowImportExportEverywhere: true,
            locations: true,
          })

          if (estree.body && Array.isArray(estree.body)) {
            for (const statement of estree.body) {
              if (statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration' || statement.type === 'ExportAllDeclaration') {
                exports.push(statement)
              }
            }
          }
        } catch (e: any) {
          // If parsing fails, log the error but continue processing
          console.error(`Error parsing flow expression: ${e.message}`)
        }
      }
    })

    return { imports, exports }
  } catch (e: any) {
    return {
      imports: [],
      exports: [],
      error: `MDXLD Import/Export Parsing Error: ${e.message}`,
    }
  }
}

/**
 * Parse MDX content and return the full mdast tree, simplified mdast, and frontmatter
 * @param mdxContent MDX content to parse
 * @returns Object containing mdast, simplified mdast, frontmatter, and optional error
 */
export function parseMdx(mdxContent: string): ParseMdxResult {
  try {
    const frontmatterResult = parseFrontmatter(mdxContent)

    // If there was an error parsing frontmatter, include it in the result
    if (frontmatterResult.error) {
      return {
        mdast: null,
        simplifiedMdast: null,
        frontmatter: null,
        error: frontmatterResult.error,
      }
    }

    const processor = unified().use(remarkParse).use(remarkMdx)
    const mdast = processor.parse(mdxContent)

    const simplifiedMdast = simplifyMdast(mdast)

    return {
      mdast,
      simplifiedMdast,
      frontmatter: frontmatterResult.frontmatter,
    }
  } catch (e: any) {
    return {
      mdast: null,
      simplifiedMdast: null,
      frontmatter: null,
      error: `MDXLD MDX Parsing Error: ${e.message}`,
    }
  }
}

/**
 * Create a simplified version of the mdast tree
 * @param node mdast node to simplify
 * @returns Simplified mdast node
 */
export function simplifyMdast(node: any): any {
  if (!node) return null

  if (Array.isArray(node)) {
    return node.map((item) => simplifyMdast(item))
  }

  if (typeof node === 'object') {
    const simplified: Record<string, any> = {}

    const essentialProps = ['type', 'value', 'children', 'lang', 'meta', 'url', 'alt', 'title']

    for (const prop of essentialProps) {
      if (node[prop] !== undefined) {
        if (prop === 'children' && Array.isArray(node.children)) {
          simplified.children = node.children.map((child: any) => simplifyMdast(child))
        } else {
          simplified[prop] = node[prop]
        }
      }
    }

    if (node.position) {
      simplified.position = {
        start: { line: node.position.start.line, column: node.position.start.column },
        end: { line: node.position.end.line, column: node.position.end.column },
      }
    }

    return simplified
  }

  return node
}

export function parseFrontmatter(mdxContent: string): ParseFrontmatterResult {
  const frontmatterRegex = /^\s*---([\s\S]*?)---/
  const match = mdxContent.match(frontmatterRegex)

  if (!match) {
    // Frontmatter is optional, return empty object instead of error
    return { frontmatter: {} }
  }

  const yamlContent = match[1]

  try {
    const frontmatter = parse(yamlContent)
    if (frontmatter === null || frontmatter === undefined) {
      // Empty frontmatter is allowed, return empty object
      return { frontmatter: {} }
    }
    if (typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
      // YAML can parse to string, number, boolean, array, or object.
      // We require an object for frontmatter.
      return {
        frontmatter: null,
        error: 'MDXLD Invalid Frontmatter: Frontmatter must be a YAML object (key-value pairs).',
      }
    }
    return { frontmatter: frontmatter as Record<string, any> }
  } catch (e: any) {
    // The 'yaml' library throws YAMLError, which has a 'message' property.
    return { frontmatter: null, error: `MDXLD YAML Parsing Error: ${e.message}` }
  }
}

// Helper function to recursively transform keys
function transformNode(node: any): any {
  if (Array.isArray(node)) {
    return node.map(transformNode)
  }
  if (typeof node === 'object' && node !== null) {
    const newNode: Record<string, any> = {}
    for (const key in node) {
      let newKey = key
      if (key === '$id') newKey = '@id'
      else if (key === '$type') newKey = '@type'
      // $context is handled at the top level, not recursively for nodes within a graph

      newNode[newKey] = transformNode(node[key])
    }
    return newNode
  }
  return node
}

export function convertToJSONLD(yamlObject: Record<string, any> | null): Record<string, any> {
  if (!yamlObject || Object.keys(yamlObject).length === 0) {
    return { '@graph': [] } // Handle empty or null input
  }

  const jsonld: Record<string, any> = {}
  let processedInput = { ...yamlObject }

  // Handle top-level $context
  if (processedInput.hasOwnProperty('$context')) {
    const contextValue = processedInput['$context']
    if (typeof contextValue !== 'string' && (typeof contextValue !== 'object' || contextValue === null) && !Array.isArray(contextValue)) {
      throw new TypeError("MDXLD Invalid $context: '$context' must be a string, object, or array.")
    }
    jsonld['@context'] = transformNode(contextValue)
    delete processedInput['$context'] // Remove from further processing
  }

  // Handle $graph
  if (processedInput.hasOwnProperty('$graph') && Array.isArray(processedInput['$graph'])) {
    jsonld['@graph'] = processedInput['$graph'].map(transformNode)
    // If there are other keys alongside $graph and $context, they are ignored as per typical JSON-LD with @graph.
    // Or, decide if they should be part of the main node description if @graph is not exclusive.
    // For now, assuming $graph, if present, defines the graph content exclusively (besides @context).
  } else {
    // No $graph, so the entire (remaining) object becomes a single node in the @graph array
    jsonld['@graph'] = [transformNode(processedInput)]
  }

  return jsonld
}
