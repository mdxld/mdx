import React, { useState, useEffect } from 'react'
import { Box, Text, useApp } from 'ink'
import path from 'node:path'
import fs from 'node:fs/promises'
import { MDXRenderer } from './MDXRenderer'
import { InputHandler } from './InputHandler'
import { WorkflowRunner } from './WorkflowRunner'
import { findRouteByPath, RouteNode } from '../utils/file-utils'
import { parseFrontmatter } from '@mdxui/ink'

interface Screen {
  id: string
  title: string
  type: 'file' | 'directory' | 'workflow' | 'input' | 'custom'
  content?: string
  filePath?: string
  component?: React.ReactNode
  data?: Record<string, any>
}

interface NavigationHistory {
  screens: Screen[]
  currentIndex: number
}

interface ScreenManagerProps {
  initialScreen?: Screen
  routeTree?: RouteNode | null
  onExit?: () => void
}

export const ScreenManager: React.FC<ScreenManagerProps> = ({ initialScreen, routeTree, onExit }) => {
  const { exit } = useApp()
  const [history, setHistory] = useState<NavigationHistory>({
    screens: initialScreen ? [initialScreen] : [],
    currentIndex: 0,
  })
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [frontmatter, setFrontmatter] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [inputs, setInputs] = useState<Record<string, any>>({})

  const currentScreen = history.screens[history.currentIndex] || null

  useEffect(() => {
    const loadContent = async () => {
      if (currentScreen?.type === 'file' && currentScreen.filePath) {
        try {
          setLoading(true)
          const content = await fs.readFile(currentScreen.filePath, 'utf-8')
          setFileContent(content)

          const { frontmatter: parsedFrontmatter } = parseFrontmatter(content)
          setFrontmatter(parsedFrontmatter)
        } catch (err) {
          setError(`Error loading file: ${err instanceof Error ? err.message : String(err)}`)
        } finally {
          setLoading(false)
        }
      }
    }

    loadContent()
  }, [currentScreen])

  const navigateTo = (screen: Screen) => {
    setHistory((prev) => {
      const newScreens = prev.screens.slice(0, prev.currentIndex + 1)
      return {
        screens: [...newScreens, screen],
        currentIndex: newScreens.length,
      }
    })
  }

  const navigateToFile = async (filePath: string, title?: string) => {
    navigateTo({
      id: filePath,
      title: title || path.basename(filePath),
      type: 'file',
      filePath,
    })
  }

  const navigateToRoute = (routePath: string[]) => {
    if (!routeTree) return

    const routeNode = findRouteByPath(routeTree, routePath)
    if (!routeNode) return

    if (routeNode.indexFile) {
      navigateToFile(routeNode.indexFile, routePath[routePath.length - 1] || 'Home')
    } else {
      navigateTo({
        id: routePath.join('/') || 'root',
        title: routePath[routePath.length - 1] || 'Home',
        type: 'directory',
        data: { routeNode, routePath },
      })
    }
  }

  const goBack = () => {
    if (history.currentIndex > 0) {
      setHistory((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
      }))
    } else if (onExit) {
      onExit()
    }
  }

  const goForward = () => {
    if (history.currentIndex < history.screens.length - 1) {
      setHistory((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
      }))
    }
  }

  const handleInputsCollected = (collectedInputs: Record<string, any>) => {
    setInputs((prev) => ({ ...prev, ...collectedInputs }))
  }

  const handleWorkflowComplete = (results: Record<string, any>) => {
    goBack()
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
          <Text dimColor>Press any key to go back</Text>
        </Box>
      </Box>
    )
  }

  if (!currentScreen) {
    return (
      <Box>
        <Text color='yellow'>No screen to display</Text>
      </Box>
    )
  }

  if (currentScreen.type === 'file' && fileContent) {
    return (
      <Box flexDirection='column'>
        <Box borderStyle='single' borderColor='blue' padding={1} marginBottom={1}>
          <Text bold color='blue'>
            {currentScreen.title}
          </Text>
        </Box>

        {/* Handle inputs if needed */}
        {frontmatter.inputs && Object.keys(frontmatter.inputs).length > 0 && (
          <InputHandler frontmatter={frontmatter} onInputsCollected={handleInputsCollected} initialInputs={inputs} />
        )}

        {/* Handle workflow if present */}
        {(frontmatter.workflow || frontmatter.steps) && <WorkflowRunner frontmatter={frontmatter} onComplete={handleWorkflowComplete} onExit={goBack} />}

        {/* Render MDX content */}
        <MDXRenderer
          content={fileContent}
          filePath={currentScreen.filePath || ''}
          inputs={inputs}
          navigation={{
            navigateTo,
            navigateToFile,
            navigateToRoute,
            goBack,
            goForward,
          }}
        />

        <Box marginTop={1} borderStyle='single' borderColor='gray' padding={1}>
          <Text dimColor>
            Press <Text color='yellow'>b</Text> to go back
            {history.currentIndex < history.screens.length - 1 && (
              <>
                , <Text color='yellow'>f</Text> to go forward
              </>
            )}
            , <Text color='yellow'>q</Text> to quit
          </Text>
        </Box>
      </Box>
    )
  }

  if (currentScreen.type === 'directory' && currentScreen.data?.routeNode) {
    const { routeNode, routePath } = currentScreen.data

    return (
      <Box flexDirection='column'>
        <Box borderStyle='single' borderColor='blue' padding={1} marginBottom={1}>
          <Text bold color='blue'>
            Directory: {currentScreen.title}
          </Text>
        </Box>

        {/* Breadcrumb navigation */}
        {routePath && routePath.length > 0 && (
          <Box marginBottom={1}>
            <Text color='blue'>
              <Text color='gray'>{'/'}</Text>
              {routePath.map((segment: string, i: number) => (
                <React.Fragment key={i}>
                  <Text color='blue'>{segment}</Text>
                  <Text color='gray'>{'/'}</Text>
                </React.Fragment>
              ))}
            </Text>
          </Box>
        )}

        <Box flexDirection='column' marginY={1}>
          {routeNode.children.map((item: RouteNode, index: number) => (
            <Text key={index}>
              <Text color='yellow'>{index + 1}</Text>
              <Text>. </Text>
              {item.type === 'directory' ? <Text color='blue'>{item.name}/</Text> : <Text>{item.name}</Text>}
            </Text>
          ))}
        </Box>

        <Box marginTop={1} borderStyle='single' borderColor='gray' padding={1}>
          <Text dimColor>
            Press <Text color='yellow'>b</Text> to go back,
            <Text color='yellow'> 1-9</Text> to select an item,
            <Text color='yellow'> q</Text> to quit
          </Text>
        </Box>
      </Box>
    )
  }

  if (currentScreen.type === 'custom' && currentScreen.component) {
    return (
      <Box flexDirection='column'>
        <Box borderStyle='single' borderColor='blue' padding={1} marginBottom={1}>
          <Text bold color='blue'>
            {currentScreen.title}
          </Text>
        </Box>

        {currentScreen.component}

        <Box marginTop={1} borderStyle='single' borderColor='gray' padding={1}>
          <Text dimColor>
            Press <Text color='yellow'>b</Text> to go back,
            <Text color='yellow'> q</Text> to quit
          </Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Text color='yellow'>Unknown screen type: {currentScreen.type}</Text>
    </Box>
  )
}
