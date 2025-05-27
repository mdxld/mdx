import React from 'react'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import { MCPSource } from '../types.js'

interface MCPSourceListProps {
  sources: MCPSource[]
  onRemoveSource: (id: string) => void
}

export const MCPSourceList: React.FC<MCPSourceListProps> = ({ sources, onRemoveSource }) => {
  if (sources.length === 0) {
    return (
      <Box marginY={1}>
        <Text dimColor>No MCP sources added. Press 'm' to add a source.</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection='column' marginY={1}>
      <Text bold>MCP Sources:</Text>

      {sources.map((source) => (
        <Box key={source.id} marginLeft={2} marginTop={1}>
          <Box marginRight={1}>
            {source.status === 'connecting' ? (
              <Text color='yellow'>
                <Spinner type='dots' />
              </Text>
            ) : source.status === 'connected' ? (
              <Text color='green'>●</Text>
            ) : (
              <Text color='red'>●</Text>
            )}
          </Box>

          <Box flexDirection='column' flexGrow={1}>
            <Box>
              <Text color={source.status === 'error' ? 'red' : 'white'}>
                {source.transportType === 'sse' ? '🌐' : '💻'} {source.url}
              </Text>
            </Box>

            {source.status === 'error' && source.errorMessage && (
              <Box marginLeft={2}>
                <Text color='red'>{source.errorMessage}</Text>
              </Box>
            )}
          </Box>

          <Box marginLeft={1}>
            <Text color='red' dimColor>
              [Press {source.id} to remove]
            </Text>
          </Box>
        </Box>
      ))}
    </Box>
  )
}
