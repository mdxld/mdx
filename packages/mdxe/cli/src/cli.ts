import React from 'react'
import { render, Box, Text, useInput } from 'ink'
import path from 'node:path'
import fs from 'node:fs/promises'
import pkg from '../package.json' with { type: 'json' }
import { findMdxFiles } from './utils/mdx-parser'
import { findIndexFile, fileExists } from './utils/file-utils'

import { runDevCommand } from './commands/dev'
import { runBuildCommand } from './commands/build'
import { runStartCommand } from './commands/start'
import { runExecCommand } from './commands/exec'
import { runSendCommand } from './commands/send'
import { runTestCommand } from './commands/test'
import { ExecutionContextType } from './utils/execution-context'

export { executeCodeBlock, executeCodeBlocks, executeMdxCodeBlocks } from './utils/execution-engine'
export type { ExecutionResult, ExecutionOptions } from './utils/execution-engine'

/**
 * Run the CLI
 */
export async function run() {
  const args = process.argv.slice(2)
  const command = args[0]
  const cwd = process.cwd()

  if (command === 'dev') {
    return runDevCommand(cwd)
  } else if (command === 'build') {
    return runBuildCommand(cwd)
  } else if (command === 'start') {
    return runStartCommand(cwd)
  } else if (command === 'test') {
    const watchFlag = args.includes('--watch')
    return runTestCommand(cwd, watchFlag)
  } else if (command === 'lint') {
    console.log('Lint command not implemented yet')
    return
  } else if (command === 'exec') {
    const watchFlag = args.includes('--watch')
    const filePath = args.filter((arg) => !arg.startsWith('--'))[1] || (await findIndexFile(cwd))
    if (!filePath) {
      console.log('No file specified and no index file found')
      return
    }

    let contextType = undefined
    const contextIndex = args.indexOf('--context')
    if (contextIndex !== -1 && args.length > contextIndex + 1) {
      const context = args[contextIndex + 1]
      if (['dev', 'test', 'production', 'default'].includes(context)) {
        contextType = context as ExecutionContextType
      }
    }

    return runExecCommand(filePath, { watch: watchFlag }, contextType)
  } else if (command === 'send') {
    const eventName = args[1]
    const eventData = args[2]
    const verboseFlag = args.includes('--verbose') || args.includes('-v')
    
    return runSendCommand(eventName, eventData, { verbose: verboseFlag })
  }

  let targetDir = cwd

  if (args.length > 0 && command !== 'test' && command !== 'dev' && command !== 'build' && command !== 'start' && command !== 'exec') {
    const resolvedPath = path.resolve(process.cwd(), command)
    try {
      const stat = await fs.stat(resolvedPath)
      if (stat.isDirectory()) {
        targetDir = resolvedPath
      }
    } catch (err) {}
  }

  try {
    const SimpleApp = ({ cwd = process.cwd() }) => {
      const [files, setFiles] = React.useState<string[]>([])
      const [indexFile, setIndexFile] = React.useState<string | null>(null)
      const [loading, setLoading] = React.useState(true)
      const [error, setError] = React.useState<string | null>(null)
      const [exit, setExit] = React.useState(false)

      React.useEffect(() => {
        const loadFiles = async () => {
          try {
            setLoading(true)
            const mdxFiles = await findMdxFiles(cwd)
            setFiles(mdxFiles)

            const index = await findIndexFile(cwd)
            setIndexFile(index)
          } catch (err) {
            setError(`Error loading files: ${err instanceof Error ? err.message : String(err)}`)
          } finally {
            setLoading(false)
          }
        }

        loadFiles()
      }, [cwd])

      React.useEffect(() => {
        if (!loading && !error) {
          if (indexFile || files.length === 1) {
            const fileToExecute = indexFile || files[0]
            setExit(true)
            setTimeout(() => {
              runExecCommand(fileToExecute)
            }, 100)
          }
        }
      }, [loading, error, files.length, indexFile, files])

      const [selectedIndex, setSelectedIndex] = React.useState(0)

      useInput((input, key) => {
        if (input === 'q' || key.escape) {
          setExit(true)
        } else if (key.upArrow && selectedIndex > 0) {
          setSelectedIndex((prev) => prev - 1)
        } else if (key.downArrow && selectedIndex < files.length - 1) {
          setSelectedIndex((prev) => prev + 1)
        } else if (key.return && files.length > 0) {
          const selectedFile = files[selectedIndex]
          setExit(true)
          setTimeout(() => {
            runExecCommand(selectedFile)
          }, 100)
        }
      })

      if (exit) {
        return null
      }

      if (loading) {
        return React.createElement(Box, null, React.createElement(Text, { color: 'yellow' }, 'Loading MDX files...'))
      }

      if (error) {
        return React.createElement(Box, { flexDirection: 'column' }, React.createElement(Text, { color: 'red' }, `Error: ${error}`))
      }

      return React.createElement(
        Box,
        { flexDirection: 'column', padding: 1 },
        React.createElement(
          Box,
          { marginBottom: 1 },
          React.createElement(Text, { bold: true, color: 'green' }, 'MDXE - Markdown/MDX-First Application Framework'),
        ),

        React.createElement(
          Box,
          { marginBottom: 1 },
          React.createElement(Text, null, 'Current directory: ', React.createElement(Text, { color: 'blue' }, cwd)),
        ),

        indexFile &&
          React.createElement(
            Box,
            { marginBottom: 1 },
            React.createElement(Text, null, 'Found index file: ', React.createElement(Text, { color: 'green' }, path.basename(indexFile))),
          ),

        React.createElement(Box, { marginY: 1 }, React.createElement(Text, { bold: true }, 'Available MDX Files:')),

        files.length > 0
          ? React.createElement(
              Box,
              { flexDirection: 'column', marginY: 1 },
              ...files.map((file, index) =>
                React.createElement(
                  Text,
                  { key: file },
                  React.createElement(Text, { color: index === selectedIndex ? 'green' : 'yellow' }, index === selectedIndex ? '→ ' : '  '),
                  React.createElement(Text, null, path.relative(cwd, file)),
                ),
              ),
            )
          : React.createElement(Box, null, React.createElement(Text, { color: 'yellow' }, 'No MDX files found in this directory.')),

        React.createElement(
          Box,
          { marginTop: 1 },
          React.createElement(
            Text,
            { dimColor: true },
            files.length > 1 ? 'Use arrow keys to navigate, ' : '',
            files.length > 0 ? React.createElement(React.Fragment, null, React.createElement(Text, { color: 'yellow' }, 'Enter'), ' to select, or ') : 'Press ',
            React.createElement(Text, { color: 'yellow' }, 'q'),
            ' to quit',
          ),
        ),
      )
    }

    const { waitUntilExit } = render(React.createElement(SimpleApp, { cwd: targetDir }))

    await waitUntilExit()
  } catch (error) {
    console.error('Error running CLI:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
}
