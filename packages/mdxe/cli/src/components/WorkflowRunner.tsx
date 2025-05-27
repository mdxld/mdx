import React, { useState } from 'react'
import { Box, Text } from 'ink'
import { WorkflowManager, MdxFrontmatter } from '@mdxui/ink'

interface WorkflowRunnerProps {
  frontmatter: MdxFrontmatter
  onComplete?: (results: Record<string, any>) => void
  onExit?: () => void
}

export const WorkflowRunner: React.FC<WorkflowRunnerProps> = ({ frontmatter, onComplete, onExit }) => {
  const [isRunning, setIsRunning] = useState(true)
  const [results, setResults] = useState<Record<string, any> | null>(null)

  const hasWorkflow = frontmatter.workflow || (frontmatter.steps && frontmatter.steps.length > 0)

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

  return <WorkflowManager frontmatter={frontmatter} onComplete={handleWorkflowComplete} onCancel={handleCancel} />
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
