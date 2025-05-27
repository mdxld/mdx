import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { MCPSource } from '../types.js'
import { detectTransportType } from '../chatService.js'

interface MCPSourceManagerProps {
  onAddSource: (source: string) => void
  disabled?: boolean
}

export const MCPSourceManager: React.FC<MCPSourceManagerProps> = ({ onAddSource, disabled = false }) => {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useInput((input, key) => {
    if (disabled) return

    if (key.return) {
      if (value.trim()) {
        try {
          detectTransportType(value.trim())
          onAddSource(value.trim())
          setValue('')
          setError(null)
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    } else if (key.backspace || key.delete) {
      setValue((prev) => prev.slice(0, -1))
      if (error) setError(null)
    } else if (!key.ctrl && !key.meta && !key.shift && input && input.length === 1) {
      setValue((prev) => prev + input)
      if (error) setError(null)
    }
  })

  return (
    <Box flexDirection='column' marginY={1}>
      <Box>
        <Text bold color='green'>
          Add MCP Source:{' '}
        </Text>
        <Text>{value}</Text>
        {!disabled && <Text>_</Text>}
      </Box>

      {error && (
        <Box marginTop={1}>
          <Text color='red'>{error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Enter a URL for SSE transport (https://...) or a command with args for stdio transport (node server.js)</Text>
      </Box>
    </Box>
  )
}
