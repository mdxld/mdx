import React from 'react'
import { Box, Text } from 'ink'
import { Source } from '../types.js'

interface SourcesListProps {
  sources: Source[]
}

export const SourcesList: React.FC<SourcesListProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null
  }

  return (
    <Box flexDirection='column' marginY={1} borderStyle='round' borderColor='cyan' padding={1}>
      <Text bold color='cyan'>
        Sources:
      </Text>

      {sources.map((source, index) => (
        <Box key={index} marginTop={1} flexDirection='column'>
          <Text>
            {index + 1}. <Text bold>{source.title}</Text>
          </Text>
          <Text color='blue'>{source.url}</Text>
        </Box>
      ))}
    </Box>
  )
}
