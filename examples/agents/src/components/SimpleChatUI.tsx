import React, { useState } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import Spinner from 'ink-spinner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export const SimpleChatUI: React.FC = () => {
  const { exit } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)

  useInput((value, key) => {
    if (key.ctrl && value === 'c') {
      exit()
    }

    if (key.return) {
      if (input.trim()) {
        handleSubmit(input)
        setInput('')
      }
    } else if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1))
    } else if (!key.ctrl && !key.meta && value && value.length === 1) {
      setInput((prev) => prev + value)
    }

    if (value === 'w' && !isLoading) {
      setWebSearchEnabled((prev) => !prev)
    }
  })

  const handleSubmit = (text: string) => {
    // Add user message
    const userMessage: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])

    setIsLoading(true)

    // Simulate response delay
    setTimeout(() => {
      let response = ''

      if (text.toLowerCase().includes('mdx')) {
        response = webSearchEnabled
          ? 'According to the MDX documentation, MDX is a format that combines Markdown with JSX. It allows you to use JSX in your markdown content. You can import components, such as interactive charts or alerts, and embed them within your content. This makes writing long-form content with components a blast.'
          : 'MDX is a format that combines Markdown with JSX. It allows you to write JSX directly in your Markdown documents, enabling you to include React components within your content.'
      } else {
        response = "I'm a CLI assistant built with React Ink. I can help answer questions about MDX, React, or JavaScript."
      }

      const assistantMessage: Message = { role: 'assistant', content: response }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Box flexDirection='column' padding={1}>
      <Box marginBottom={1} justifyContent='center'>
        <Text bold>MDX Chat CLI {webSearchEnabled && <Text color='cyan'>[Web Search Enabled]</Text>}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>
          Press <Text color='cyan'>w</Text> to toggle web search, <Text color='red'>Ctrl+C</Text> to exit
        </Text>
      </Box>

      <Box flexDirection='column'>
        {messages.map((msg, i) => (
          <Box key={i} flexDirection='column' marginY={1}>
            <Text bold color={msg.role === 'user' ? 'green' : 'blue'}>
              {msg.role === 'user' ? 'You' : 'Assistant'}:
            </Text>
            <Box marginLeft={2} marginTop={1}>
              <Text>{msg.content}</Text>
            </Box>
          </Box>
        ))}
      </Box>

      {isLoading && (
        <Box marginY={1}>
          <Text color='yellow'>
            <Spinner type='dots' /> Thinking...
          </Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text bold color='green'>
          You:{' '}
        </Text>
        <Text>{input}</Text>
        <Text>{!isLoading && '_'}</Text>
      </Box>
    </Box>
  )
}
