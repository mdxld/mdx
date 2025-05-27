import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { z } from 'zod'

interface InputPromptProps {
  label: string
  type?: 'string' | 'number' | 'boolean' | 'enum'
  options?: string[]
  required?: boolean
  defaultValue?: any
  description?: string
  validate?: (value: any) => string | null
  onSubmit: (value: any) => void
  onCancel?: () => void
}

export const InputPrompt: React.FC<InputPromptProps> = ({
  label,
  type = 'string',
  options = [],
  required = false,
  defaultValue,
  description,
  validate,
  onSubmit,
  onCancel,
}) => {
  const [value, setValue] = useState<any>(defaultValue !== undefined ? defaultValue : '')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useInput((input, key) => {
    if (submitted) return

    if (key.return) {
      if (required && (value === undefined || value === '')) {
        setError('This field is required')
        return
      }

      if (validate) {
        const validationError = validate(value)
        if (validationError) {
          setError(validationError)
          return
        }
      }

      setSubmitted(true)
      onSubmit(value)
    } else if (key.escape) {
      setSubmitted(true)
      if (onCancel) onCancel()
    } else if (key.backspace || key.delete) {
      if (type === 'enum') {
      } else if (type === 'boolean') {
        setValue(!value)
      } else {
        setValue((prev: any) => (typeof prev === 'string' ? prev.slice(0, -1) : ''))
      }
      setError(null)
    } else if (type === 'enum' && /^\d$/.test(input)) {
      const index = parseInt(input, 10) - 1
      if (index >= 0 && index < options.length) {
        setValue(options[index])
      }
    } else if (type === 'boolean') {
      if (input.toLowerCase() === 'y' || input.toLowerCase() === 't') {
        setValue(true)
      } else if (input.toLowerCase() === 'n' || input.toLowerCase() === 'f') {
        setValue(false)
      }
    } else if (type === 'number' && !/^\d$/.test(input) && input !== '.') {
      return
    } else {
      setValue((prev: any) => `${prev}${input}`)
      setError(null)
    }
  })

  if (submitted) {
    return null
  }

  return (
    <Box flexDirection='column' padding={1} borderStyle='round' borderColor='blue'>
      <Box>
        <Text bold>
          {required ? '* ' : ''}
          {label}
        </Text>
      </Box>

      {description && (
        <Box marginBottom={1}>
          <Text dimColor>{description}</Text>
        </Box>
      )}

      <Box marginY={1}>
        {type === 'enum' ? (
          <Box flexDirection='column'>
            {options.map((option, index) => (
              <Text key={option}>
                <Text color='yellow'>{index + 1}</Text>
                <Text>. </Text>
                <Text color={value === option ? 'green' : 'white'}>
                  {value === option ? '> ' : '  '}
                  {option}
                </Text>
              </Text>
            ))}
          </Box>
        ) : type === 'boolean' ? (
          <Box>
            <Text color={value === true ? 'green' : 'white'}>[{value === true ? 'X' : ' '}] Yes</Text>
            <Text> / </Text>
            <Text color={value === false ? 'green' : 'white'}>[{value === false ? 'X' : ' '}] No</Text>
            <Text> (y/n)</Text>
          </Box>
        ) : (
          <Box>
            <Text>
              {value}
              <Text color='gray'>_</Text>
            </Text>
          </Box>
        )}
      </Box>

      {error && (
        <Box marginY={1}>
          <Text color='red'>{error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          Press <Text color='green'>Enter</Text> to submit,
          <Text color='red'> Esc</Text> to cancel
        </Text>
      </Box>
    </Box>
  )
}
