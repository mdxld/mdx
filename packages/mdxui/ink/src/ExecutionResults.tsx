import React from 'react'
import { Box, Text } from 'ink'
import type { CodeExecutionResult } from './code-execution'

export interface ExecutionResultsProps {
  results: CodeExecutionResult[]
}

/**
 * Component to display code execution results in the terminal
 */
export function ExecutionResults({ results }: ExecutionResultsProps) {
  if (results.length === 0) {
    return null
  }

  return (
    <Box flexDirection='column' marginTop={1}>
      <Text bold color='cyan'>
        Code Execution Results:
      </Text>
      {results.map((result, index) => (
        <Box key={index} flexDirection='column' marginTop={1} paddingLeft={2}>
          <Text bold>Block {index + 1}:</Text>
          {result.success ? (
            result.output ? (
              <Box borderStyle='round' borderColor='green' paddingX={1} marginTop={1}>
                <Text color='green'>{result.output}</Text>
              </Box>
            ) : (
              <Text color='green'>✓ Executed successfully (no output)</Text>
            )
          ) : (
            <Box borderStyle='round' borderColor='red' paddingX={1} marginTop={1}>
              <Text color='red'>✗ Error: {result.error}</Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
}
