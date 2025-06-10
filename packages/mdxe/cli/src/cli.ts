import React from 'react'
import { render, Box, Text, useInput } from 'ink'
import path from 'node:path'
import fs from 'node:fs/promises'
import pkg from '../package.json' with { type: 'json' }
import { findMdxFiles, extractAllFunctions, extractFunctionsFromMdxFile, ExtractedFunction } from './utils/mdx-parser'
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

  if (command && /^([a-zA-Z_$][a-zA-Z0-9_$]*)\((.*)\)$/.test(command)) {
    return await executeFunctionFromCommandLine(command, cwd)
  }

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
      const [functions, setFunctions] = React.useState<ExtractedFunction[]>([])
      const [indexFile, setIndexFile] = React.useState<string | null>(null)
      const [loading, setLoading] = React.useState(true)
      const [error, setError] = React.useState<string | null>(null)
      const [exit, setExit] = React.useState(false)
      const [mode, setMode] = React.useState<'files' | 'functions'>('files')
      const [selectedFile, setSelectedFile] = React.useState<string | null>(null)

      React.useEffect(() => {
        const loadFiles = async () => {
          try {
            setLoading(true)
            const mdxFiles = await findMdxFiles(cwd)
            setFiles(mdxFiles)

            const index = await findIndexFile(cwd)
            setIndexFile(index)

            const allFunctions = await extractAllFunctions(cwd)
            setFunctions(allFunctions)
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
          if (mode === 'functions') {
            setMode('files')
            setSelectedFile(null)
            setSelectedIndex(0)
          } else {
            setExit(true)
          }
        } else if (mode === 'files') {
          if (key.upArrow && selectedIndex > 0) {
            setSelectedIndex((prev) => prev - 1)
          } else if (key.downArrow && selectedIndex < files.length - 1) {
            setSelectedIndex((prev) => prev + 1)
          } else if (key.return && files.length > 0) {
            const file = files[selectedIndex]
            setSelectedFile(file)
            setMode('functions')
            setSelectedIndex(0)
          } else if (input === 'f' && functions.length > 0) {
            setSelectedFile(null)
            setMode('functions')
            setSelectedIndex(0)
          }
        } else if (mode === 'functions') {
          const currentFunctions = selectedFile 
            ? functions.filter(f => f.sourceFile === selectedFile)
            : functions
          
          if (key.upArrow && selectedIndex > 0) {
            setSelectedIndex((prev) => prev - 1)
          } else if (key.downArrow && selectedIndex < currentFunctions.length - 1) {
            setSelectedIndex((prev) => prev + 1)
          } else if (key.return && currentFunctions.length > 0) {
            const selectedFunction = currentFunctions[selectedIndex]
            setExit(true)
            setTimeout(() => {
              executeFunctionInteractively(selectedFunction)
            }, 100)
          }
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

      if (mode === 'files') {
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

          functions.length > 0 && React.createElement(
            Box,
            { marginTop: 1 },
            React.createElement(Text, { color: 'cyan' }, `Found ${functions.length} functions across all files`),
          ),

          React.createElement(
            Box,
            { marginTop: 1 },
            React.createElement(
              Text,
              { dimColor: true },
              files.length > 1 ? 'Use arrow keys to navigate, ' : '',
              files.length > 0 ? React.createElement(React.Fragment, null, React.createElement(Text, { color: 'yellow' }, 'Enter'), ' to view functions in file, ') : '',
              functions.length > 0 ? React.createElement(React.Fragment, null, React.createElement(Text, { color: 'yellow' }, 'f'), ' for all functions, ') : '',
              React.createElement(Text, { color: 'yellow' }, 'q'),
              ' to quit',
            ),
          ),
        )
      } else if (mode === 'functions') {
        const currentFunctions = selectedFile 
          ? functions.filter(f => f.sourceFile === selectedFile)
          : functions

        return React.createElement(
          Box,
          { flexDirection: 'column', padding: 1 },
          React.createElement(
            Box,
            { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: 'green' }, 'MDXE - Function Browser'),
          ),

          selectedFile && React.createElement(
            Box,
            { marginBottom: 1 },
            React.createElement(Text, null, 'File: ', React.createElement(Text, { color: 'blue' }, path.relative(cwd, selectedFile))),
          ),

          !selectedFile && React.createElement(
            Box,
            { marginBottom: 1 },
            React.createElement(Text, null, 'Showing functions from all files'),
          ),

          React.createElement(Box, { marginY: 1 }, React.createElement(Text, { bold: true }, 'Available Functions:')),

          currentFunctions.length > 0
            ? React.createElement(
                Box,
                { flexDirection: 'column', marginY: 1 },
                ...currentFunctions.map((func, index) =>
                  React.createElement(
                    Box,
                    { key: `${func.sourceFile}-${func.name}`, flexDirection: 'column' },
                    React.createElement(
                      Text,
                      null,
                      React.createElement(Text, { color: index === selectedIndex ? 'green' : 'yellow' }, index === selectedIndex ? '→ ' : '  '),
                      React.createElement(Text, { bold: true }, func.name),
                      React.createElement(Text, { color: 'gray' }, `(${func.params.join(', ')})`),
                      func.isAsync && React.createElement(Text, { color: 'blue' }, ' async'),
                      func.isExported && React.createElement(Text, { color: 'green' }, ' exported'),
                    ),
                    index === selectedIndex && React.createElement(
                      Box,
                      { marginLeft: 4 },
                      React.createElement(Text, { color: 'gray', dimColor: true }, `Type: ${func.type} | File: ${path.basename(func.sourceFile)}`),
                    ),
                  ),
                ),
              )
            : React.createElement(Box, null, React.createElement(Text, { color: 'yellow' }, selectedFile ? 'No functions found in this file.' : 'No functions found.')),

          React.createElement(
            Box,
            { marginTop: 1 },
            React.createElement(
              Text,
              { dimColor: true },
              currentFunctions.length > 1 ? 'Use arrow keys to navigate, ' : '',
              currentFunctions.length > 0 ? React.createElement(React.Fragment, null, React.createElement(Text, { color: 'yellow' }, 'Enter'), ' to execute, ') : '',
              React.createElement(Text, { color: 'yellow' }, 'q'),
              ' to go back',
            ),
          ),
        )
      }

      return null
    }

    const { waitUntilExit } = render(React.createElement(SimpleApp, { cwd: targetDir }))

    await waitUntilExit()
  } catch (error) {
    console.error('Error running CLI:', error)
    process.exit(1)
  }
}

/**
 * Execute a function from command line (e.g., mdxe fizzBuzz(20))
 */
async function executeFunctionFromCommandLine(functionCall: string, cwd: string): Promise<void> {
  const match = functionCall.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\((.*)\)$/)
  if (!match) {
    console.error('Invalid function call format')
    return
  }

  const [, functionName, argsString] = match
  console.log(`Searching for function: ${functionName}`)

  try {
    const allFunctions = await extractAllFunctions(cwd)
    const targetFunction = allFunctions.find(f => f.name === functionName)

    if (!targetFunction) {
      console.error(`Function '${functionName}' not found in any MDX files`)
      console.log('Available functions:')
      allFunctions.forEach(f => {
        console.log(`  - ${f.name}(${f.params.join(', ')}) in ${path.relative(cwd, f.sourceFile)}`)
      })
      return
    }

    console.log(`Found function '${functionName}' in ${path.relative(cwd, targetFunction.sourceFile)}`)

    let args: any[] = []
    if (argsString.trim()) {
      try {
        args = JSON.parse(`[${argsString}]`)
      } catch (error) {
        console.error('Error parsing function arguments. Use JSON format (e.g., "hello", 42, true)')
        return
      }
    }

    await executeFunctionWithArgs(targetFunction, args)
  } catch (error) {
    console.error('Error executing function:', error)
  }
}

/**
 * Execute a function interactively (from the UI)
 */
async function executeFunctionInteractively(func: ExtractedFunction): Promise<void> {
  console.log(`\nExecuting function: ${func.name}(${func.params.join(', ')})`)
  console.log(`From file: ${path.relative(process.cwd(), func.sourceFile)}`)
  
  await executeFunctionWithArgs(func, [])
}

/**
 * Execute a function with given arguments
 */
async function executeFunctionWithArgs(func: ExtractedFunction, args: any[]): Promise<void> {
  try {
    const { executeCodeBlock } = await import('./utils/execution-engine')
    
    const functionCall = `${func.name}(${args.map(arg => JSON.stringify(arg)).join(', ')})`
    const codeToExecute = `${func.codeBlock.value}\n\nconst result = ${functionCall}\nconsole.log('Result:', result)\nresult`

    const codeBlock = {
      lang: func.codeBlock.lang,
      meta: func.codeBlock.meta,
      value: codeToExecute
    }

    console.log(`\nExecuting: ${functionCall}`)
    console.log('---')

    const result = await executeCodeBlock(codeBlock, {
      fileId: func.sourceFile,
      executionContext: 'default'
    })

    if (result.success) {
      console.log('---')
      console.log(`Execution completed in ${result.duration}ms`)
      if (result.result !== undefined) {
        console.log('Return value:', result.result)
      }
    } else {
      console.error('Execution failed:', result.error)
    }
  } catch (error) {
    console.error('Error executing function:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
}
