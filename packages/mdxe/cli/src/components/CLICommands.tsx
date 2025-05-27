import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import path from 'node:path'
import fs from 'node:fs/promises'
import { findRouteTree } from '../utils/file-utils'
import { findMdxFiles } from '../utils/mdx-parser'
import type { RouteNode } from '../utils/file-utils'

interface CLICommandsProps {
  cwd: string
  onSelectCommand: (command: string, args?: string[]) => void
  onExit: () => void
}

export const CLICommands: React.FC<CLICommandsProps> = ({ cwd, onSelectCommand, onExit }) => {
  const [commands, setCommands] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [routeTree, setRouteTree] = useState<RouteNode | null>(null)

  React.useEffect(() => {
    const loadCommands = async () => {
      try {
        setLoading(true)
        const mdxFiles = await findMdxFiles(cwd)
        const commands = mdxFiles.map((file) => {
          const relativePath = path.relative(cwd, file)
          const parts = relativePath.split(path.sep)
          return parts[0].replace(/\.(md|mdx)$/, '')
        })

        const uniqueCommands = [...new Set(commands)]
        setCommands(uniqueCommands as string[])

        const tree = await findRouteTree(cwd)
        setRouteTree(tree)
      } catch (err) {
        setError(`Error loading commands: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    loadCommands()
  }, [cwd])

  useInput((input, key) => {
    if (key.escape || input.toLowerCase() === 'q') {
      onExit()
      return
    }

    if (key.return) {
      if (routeTree && routeTree.indexFile) {
        onSelectCommand('exec', [routeTree.indexFile])
      }
      return
    }

    if (/^\d$/.test(input)) {
      const index = parseInt(input, 10) - 1
      if (index >= 0 && index < commands.length) {
        onSelectCommand(commands[index])
      }
    }

    switch (input.toLowerCase()) {
      case 't':
        onSelectCommand('test')
        break
      case 'd':
        onSelectCommand('dev')
        break
      case 'b':
        onSelectCommand('build')
        break
      case 's':
        onSelectCommand('start')
        break
      case 'e':
        onSelectCommand('exec')
        break
      case 'h':
        onSelectCommand('help')
        break
    }
  })

  if (loading) {
    return (
      <Box>
        <Text color='yellow'>Loading commands...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box flexDirection='column'>
        <Text color='red'>Error: {error}</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection='column' padding={1}>
      <Box marginBottom={1}>
        <Text bold color='green'>
          MDXE - Markdown/MDX-First Application Framework
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
          Current directory: <Text color='blue'>{cwd}</Text>
        </Text>
      </Box>

      {routeTree && routeTree.indexFile && (
        <Box marginBottom={1}>
          <Text>
            Found index file: <Text color='green'>{path.basename(routeTree.indexFile)}</Text>
          </Text>
        </Box>
      )}

      <Box marginY={1} borderStyle='single' borderColor='blue' padding={1}>
        <Text bold>Available Commands:</Text>
      </Box>

      <Box flexDirection='column' marginY={1}>
        <Text>
          <Text color='yellow'>t</Text> - <Text bold>test</Text>: Run tests embedded in Markdown/MDX files
        </Text>
        <Text>
          <Text color='yellow'>d</Text> - <Text bold>dev</Text>: Start a development server
        </Text>
        <Text>
          <Text color='yellow'>b</Text> - <Text bold>build</Text>: Build the project for production
        </Text>
        <Text>
          <Text color='yellow'>s</Text> - <Text bold>start</Text>: Start the production server
        </Text>
        <Text>
          <Text color='yellow'>e</Text> - <Text bold>exec</Text>: Execute code blocks in Markdown/MDX files
        </Text>
        <Text>
          <Text color='yellow'>h</Text> - <Text bold>help</Text>: Show help information
        </Text>
      </Box>

      {commands.length > 0 && (
        <>
          <Box marginY={1} borderStyle='single' borderColor='blue' padding={1}>
            <Text bold>Available MDX Files:</Text>
          </Box>

          <Box flexDirection='column' marginY={1}>
            {commands.map((command, index) => (
              <Text key={command}>
                <Text color='yellow'>{index + 1}</Text>
                <Text>. </Text>
                <Text>{command}</Text>
              </Text>
            ))}
          </Box>
        </>
      )}

      <Box marginTop={1} borderStyle='single' borderColor='gray' padding={1}>
        <Text dimColor>
          Press <Text color='yellow'>1-9</Text> to select a file,
          <Text color='yellow'> t/d/b/s/e/h</Text> for commands,
          <Text color='yellow'> Enter</Text> to run index file,
          <Text color='yellow'> q</Text> to quit
        </Text>
      </Box>
    </Box>
  )
}
