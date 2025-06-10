import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'

export interface ExecuteToolArgs {
  content: string
  context?: Record<string, any>
  fileId?: string
}

interface CodeBlock {
  lang: string
  meta: string | null
  value: string
}

function extractCodeBlocks(mdxContent: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = []
  const tree = unified().use(remarkParse).use(remarkMdx).parse(mdxContent)
  
  visit(tree, 'code', (node: any) => {
    if (node.lang === 'javascript' || node.lang === 'js' || node.lang === 'typescript' || node.lang === 'ts') {
      codeBlocks.push({
        lang: node.lang || '',
        meta: node.meta || null,
        value: node.value || ''
      })
    }
  })
  
  return codeBlocks
}

export async function executeTool(args: ExecuteToolArgs) {
  try {
    const codeBlocks = extractCodeBlocks(args.content)
    
    const results = codeBlocks.map((block, index) => {
      try {
        return {
          blockIndex: index,
          success: true,
          result: `Code block extracted: ${block.lang}`,
          error: null,
          duration: 0,
          code: block.value,
          language: block.lang
        }
      } catch (error) {
        return {
          blockIndex: index,
          success: false,
          result: null,
          error: error instanceof Error ? error.message : String(error),
          duration: 0,
          code: block.value,
          language: block.lang
        }
      }
    })
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            executionResults: results,
            totalBlocks: results.length,
            successfulBlocks: results.filter(r => r.success).length,
            extractedCodeBlocks: codeBlocks.length
          }, null, 2)
        }
      ]
    }
  } catch (error) {
    throw new Error(`Failed to process MDX code blocks: ${error instanceof Error ? error.message : String(error)}`)
  }
}
