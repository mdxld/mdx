import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { createWorkflowFromFrontmatter, executeWorkflowStep, MdxFrontmatter, WorkflowFrontmatter } from '@mdxui/ink'

interface WorkflowRunnerProps {
  frontmatter: MdxFrontmatter
  onComplete?: (results: Record<string, any>) => void
  onExit?: () => void
}

export const WorkflowRunner: React.FC<WorkflowRunnerProps> = ({ frontmatter, onComplete, onExit }) => {
  const [isRunning, setIsRunning] = useState(true)
  const [results, setResults] = useState<Record<string, any> | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [workflow, setWorkflow] = useState<any>(null)

  const hasWorkflow = frontmatter.workflow || (frontmatter.steps && frontmatter.steps.length > 0)

  useEffect(() => {
    if (hasWorkflow) {
      const workflowInstance = createWorkflowFromFrontmatter(frontmatter as WorkflowFrontmatter)
      setWorkflow(workflowInstance)
    }
  }, [frontmatter, hasWorkflow])

  if (!hasWorkflow) {
    return null
  }

  const handleWorkflowComplete = (workflowResults: Record<string, any>) => {
    setResults(workflowResults)
    setIsRunning(false)

    if (onComplete) {
      onComplete(workflowResults)
    }
  }

  const handleCancel = () => {
    setIsRunning(false)

    if (onExit) {
      onExit()
    }
  }

  if (!isRunning) {
    if (results) {
      return (
        <Box flexDirection='column' padding={1} borderStyle='round' borderColor='green'>
          <Text bold color='green'>
            Workflow Completed
          </Text>
          <Box marginTop={1}>
            <Text>Results:</Text>
          </Box>
          {Object.entries(results).map(([key, value]) => (
            <Box key={key}>
              <Text color='blue'>{key}: </Text>
              <Text>{formatValue(value)}</Text>
            </Box>
          ))}
        </Box>
      )
    }

    return null
  }

  if (!workflow) {
    return (
      <Box flexDirection='column' padding={1} borderStyle='round' borderColor='yellow'>
        <Text bold color='yellow'>
          No valid workflow found
        </Text>
        <Text>Press any key to exit...</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection='column' padding={1} borderStyle='round' borderColor='blue'>
      <Text bold color='blue'>
        Running Workflow: {workflow.name || 'Unnamed Workflow'}
      </Text>
      <Text>Step {currentStep + 1} of {workflow.steps?.length || 0}</Text>
      <Text>Press Ctrl+C to cancel</Text>
    </Box>
  )
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}
