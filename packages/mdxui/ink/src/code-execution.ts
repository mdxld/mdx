/**
 * Code execution utilities for MDX content
 */

export interface CodeExecutionResult {
  success: boolean
  output?: string
  error?: string
}

/**
 * Create a simple execution context for MDX code blocks
 */
export function createExecutionContext() {
  return {
    /**
     * Placeholder for event handling
     */
    on: async (event: string, callback: (data: any) => any) => {
      console.log(`Event registered: ${event}`)
      return callback({ type: event, data: {} })
    },

    /**
     * Placeholder for AI functions
     */
    ai: {
      async: (strings: TemplateStringsArray, ...values: any[]) => {
        console.log('AI function called with:', strings, values)
        return 'AI response placeholder'
      },

      generate: async (prompt: string) => {
        console.log('AI generate called with:', prompt)
        return 'Generated content placeholder'
      },
    },

    /**
     * Placeholder for research function
     */
    research: async function (strings: TemplateStringsArray, ...values: any[]) {
      console.log('Research function called with:', strings, values)
      return 'Research results placeholder'
    },
  }
}

/**
 * Extract and execute code blocks from MDX content
 */
export async function executeCodeBlocks(content: string): Promise<CodeExecutionResult[]> {
  const results: CodeExecutionResult[] = []

  const codeBlockRegex = /```typescript\n([\s\S]*?)```/g
  let match

  const executionContext = createExecutionContext()

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const codeBlock = match[1]
    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
      const contextKeys = Object.keys(executionContext)
      const contextValues = Object.values(executionContext)

      let output = ''
      const originalLog = console.log
      console.log = (...args) => {
        output += args.join(' ') + '\n'
      }

      const execFunction = new AsyncFunction(...contextKeys, codeBlock)
      await execFunction(...contextValues)

      console.log = originalLog

      results.push({
        success: true,
        output: output.trim(),
      })
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}

/**
 * Extract TypeScript code blocks from MDX content
 */
export function extractCodeBlocks(content: string): string[] {
  const codeBlocks: string[] = []
  const codeBlockRegex = /```typescript\n([\s\S]*?)```/g
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push(match[1].trimEnd())
  }

  return codeBlocks
}
