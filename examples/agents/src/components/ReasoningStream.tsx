import React from 'react'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'

interface ReasoningStreamProps {
  reasoning: string
  isComplete: boolean
}

export const ReasoningStream: React.FC<ReasoningStreamProps> = ({ reasoning, isComplete }) => {
  return (
    <Box flexDirection='column' marginY={1} borderStyle='round' borderColor='yellow' padding={1}>
      <Box>
        <Text bold color='yellow'>
          Reasoning:{' '}
        </Text>
        {!isComplete && (
          <Text color='yellow'>
            <Spinner type='dots' />
          </Text>
        )}
      </Box>

      <Box marginTop={1}>
        <Text color='yellow'>{reasoning}</Text>
      </Box>
    </Box>
  )
}
