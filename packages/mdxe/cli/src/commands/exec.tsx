/**
 * MDXE Exec Command
 * Executes MDX files with code blocks using esbuild transpilation
 */

import { executeMdxCodeBlocks } from '../utils/execution-engine'
import { ExecutionContextType, setRequestUpdateCallback, getAIRequests } from '../utils/execution-context'
import fs from 'node:fs/promises'
import path from 'node:path'
import React, { useState, useEffect } from 'react'
import { render, Text, Box } from 'ink'
import { AIRequestTracker, AIRequest } from '../components/AIRequestTracker'
import { FileWatcher } from '../utils/file-watcher'

export interface ExecOptions {
  watch?: boolean
}

/**
 * Run the exec command
 * @param filePath Path to the MDX file to execute
 * @param options Execution options including watch mode
 * @param contextType Optional execution context type
 */
/**
 * React component to display execution status and AI requests
 */
const ExecutionStatus: React.FC<{
  filePath: string
  contextType: string
}> = ({ filePath, contextType }) => {
  const [requests, setRequests] = useState<AIRequest[]>([])

  useEffect(() => {
    setRequestUpdateCallback((updatedRequests) => {
      setRequests([...updatedRequests])
    })

    return () => {
      setRequestUpdateCallback(() => {})
    }
  }, [])

  return (
    <Box flexDirection='column'>
      <Box marginBottom={1}>
        <Text>Executing </Text>
        <Text color='green'>{path.basename(filePath)}</Text>
        <Text> in </Text>
        <Text color='blue'>{contextType}</Text>
        <Text> context</Text>
      </Box>

      {requests.length > 0 && <AIRequestTracker requests={requests} />}
    </Box>
  )
}

export async function runExecCommand(filePath: string, options: ExecOptions = {}, contextType?: ExecutionContextType) {
  let unmount = () => {} // Default no-op function

  try {
    const execContext = contextType || 'default'

    const renderResult = render(<ExecutionStatus filePath={filePath} contextType={execContext} />)
    unmount = renderResult.unmount

    try {
      await fs.access(filePath)
    } catch (error) {
      console.error(`File not found: ${filePath}`)
      unmount()
      process.exit(1)
    }

    const executeFile = async () => {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const results = await executeMdxCodeBlocks(content, {
          executionContext: execContext as any,
        })

        unmount()

        console.log(`\n🔄 Execution complete at ${new Date().toLocaleTimeString()}`)
        console.log(`Executed ${results.length} code block(s)`)

        const aiRequests = getAIRequests()
        const completedRequests = aiRequests.filter((r) => r.status === 'completed')
        const errorRequests = aiRequests.filter((r) => r.status === 'error')

        if (aiRequests.length > 0) {
          console.log(`\nAI Requests Summary:`)
          console.log(`- Total: ${aiRequests.length}`)
          console.log(`- Completed: ${completedRequests.length}`)
          console.log(`- Errors: ${errorRequests.length}`)
        }

        const failedBlocks = results.filter((r) => !r.success)
        if (failedBlocks.length > 0) {
          console.log(`\n❌ ${failedBlocks.length} code block(s) failed`)
          failedBlocks.forEach((result, index) => {
            console.log(`  Block ${index + 1}: ${result.error}`)
          })
          process.exit(1)
        } else {
          console.log(`\n✅ All code blocks executed successfully`)
        }
      } catch (error) {
        console.error('Error executing MDX file:', error)
      }
    }

    await executeFile()

    if (options.watch) {
      const watcher = new FileWatcher(filePath, executeFile, {
        debounceDelay: 300,
      })

      watcher.start()

      process.on('SIGINT', () => {
        console.log('\n👋 Stopping file watcher...')
        watcher.stop()
        unmount()
        process.exit(0)
      })

      console.log('Press Ctrl+C to stop watching')
      await new Promise(() => {}) // Keep running indefinitely
    }
  } catch (error) {
    console.error('Error executing MDX file:', error)
    try {
      unmount()
    } catch (e) {}
    process.exit(1)
  }
}
