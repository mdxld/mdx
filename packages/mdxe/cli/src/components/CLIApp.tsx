import React, { useState } from 'react'
import { Box, Text, useApp } from 'ink'
import path from 'node:path'
import { CLICommands } from './CLICommands'
import { ScreenManager } from './ScreenManager'
import { findIndexFile, findRouteTree } from '../utils/file-utils'

interface CLIAppProps {
  initialFilePath?: string
  mode?: 'default' | 'test' | 'dev' | 'build' | 'start' | 'exec'
  options?: Record<string, any>
}

export const CLIApp: React.FC<CLIAppProps> = ({ initialFilePath, mode = 'default', options = {} }) => {
  const { exit } = useApp()
  const [currentScreen, setCurrentScreen] = useState<'commands' | 'file' | 'help'>('commands')
  const [filePath, setFilePath] = useState<string | undefined>(initialFilePath)
  const [routeTree, setRouteTree] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)

        if (initialFilePath) {
          setFilePath(initialFilePath)
          setCurrentScreen('file')
          return
        }

        if (mode !== 'default') {
          setCurrentScreen('commands')
          return
        }

        const cwd = process.cwd()
        const indexFile = await findIndexFile(cwd)

        if (indexFile) {
          setFilePath(indexFile)
          setCurrentScreen('file')
        } else {
          const tree = await findRouteTree(cwd)
          setRouteTree(tree)
          setCurrentScreen('commands')
        }
      } catch (err) {
        setError(`Error initializing CLI: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [initialFilePath, mode])

  const handleSelectCommand = async (command: string, args?: string[]) => {
    try {
      setLoading(true)

      switch (command) {
        case 'test':
          console.log('Running tests...')
          break
        case 'dev':
          console.log('Starting development server...')
          break
        case 'build':
          console.log('Building project...')
          break
        case 'start':
          console.log('Starting production server...')
          break
        case 'exec':
          if (args && args.length > 0) {
            setFilePath(args[0])
            setCurrentScreen('file')
          } else {
            const cwd = process.cwd()
            const indexFile = await findIndexFile(cwd)

            if (indexFile) {
              setFilePath(indexFile)
              setCurrentScreen('file')
            } else {
              setError('No file specified for execution and no index file found')
            }
          }
          break
        case 'help':
          setCurrentScreen('help')
          break
        default:
          const cwd = process.cwd()
          const fullPath = path.resolve(cwd, command)
          setFilePath(fullPath)
          setCurrentScreen('file')
          break
      }
    } catch (err) {
      setError(`Error executing command: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleExit = () => {
    exit()
  }

  const handleBackToCommands = () => {
    setCurrentScreen('commands')
  }

  if (loading) {
    return (
      <Box>
        <Text color='yellow'>Loading...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box flexDirection='column'>
        <Text color='red'>Error: {error}</Text>
        <Box marginTop={1}>
          <Text dimColor>Press any key to exit</Text>
        </Box>
      </Box>
    )
  }

  switch (currentScreen) {
    case 'file':
      if (!filePath) {
        return (
          <Box>
            <Text color='red'>No file path specified</Text>
          </Box>
        )
      }

      return (
        <ScreenManager
          initialScreen={{
            id: filePath,
            title: path.basename(filePath),
            type: 'file',
            filePath,
          }}
          routeTree={routeTree}
          onExit={handleBackToCommands}
        />
      )

    case 'help':
      return (
        <Box flexDirection='column' padding={1}>
          <Box marginBottom={1}>
            <Text bold color='green'>
              MDXE Help
            </Text>
          </Box>

          <Box marginY={1}>
            <Text>MDXE is a Markdown/MDX-first application framework that treats .md and .mdx files as callable functions.</Text>
          </Box>

          <Box marginY={1}>
            <Text bold>Usage:</Text>
            <Text> mdxe [command] [options]</Text>
          </Box>

          <Box marginY={1}>
            <Text bold>Commands:</Text>
            <Text> test - Run tests embedded in Markdown/MDX files</Text>
            <Text> dev - Start a development server</Text>
            <Text> build - Build the project for production</Text>
            <Text> start - Start the production server</Text>
            <Text> exec - Execute code blocks in Markdown/MDX files</Text>
            <Text> help - Show this help information</Text>
          </Box>

          <Box marginTop={1}>
            <Text dimColor>Press any key to return to the command list</Text>
          </Box>
        </Box>
      )

    case 'commands':
    default:
      return <CLICommands cwd={process.cwd()} onSelectCommand={handleSelectCommand} onExit={handleExit} />
  }
}
