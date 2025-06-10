/**
 * Input prompt utility for AI workflows
 * Provides a React Ink component for CLI input prompting
 * Extracted from MDXE CLI input prompt
 */

import React, { useState } from 'react'
import { render, Box, Text, useInput } from 'ink'

/**
 * Props for the InputPrompt component
 */
interface InputPromptProps {
  question: string
  onSubmit: (value: string) => void
}

/**
 * InputPrompt component
 * Displays a question and captures user input
 */
const InputPrompt: React.FC<InputPromptProps> = ({ question, onSubmit }) => {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useInput((value, key) => {
    if (submitted) return

    if (key.return) {
      setSubmitted(true)
      onSubmit(input)
    } else if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1))
    } else if (key.escape) {
      setSubmitted(true)
      onSubmit('')
    } else if (value && !key.ctrl && !key.meta && !key.shift) {
      setInput((prev) => prev + value)
    }
  })

  return (
    <Box flexDirection='column' padding={1}>
      <Text bold>{question}</Text>
      <Box marginTop={1}>
        <Text color='blue'>{'> '}</Text>
        <Text>{input}</Text>
        {!submitted && <Text>_</Text>}
      </Box>
      {submitted && (
        <Box marginTop={1}>
          <Text color='green'>Input received!</Text>
        </Box>
      )}
    </Box>
  )
}

/**
 * Render an input prompt and return the user's input
 * @param question The question to display
 * @returns A promise that resolves to the user's input
 */
export async function renderInputPrompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    let resolved = false

    const handleSubmit = (value: string) => {
      if (resolved) return
      resolved = true

      setTimeout(() => {
        cleanup()
        resolve(value)
      }, 500)
    }

    const { unmount } = render(<InputPrompt question={question} onSubmit={handleSubmit} />)

    const cleanup = () => {
      try {
        unmount()
      } catch (error) {}
    }

    process.on('exit', cleanup)
    process.on('SIGINT', () => {
      cleanup()
      process.exit(0)
    })
  })
}
