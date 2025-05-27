import React, { useState, useEffect } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import Spinner from 'ink-spinner'
import { ChatMessage } from './ChatMessage.js'
import { ChatInput } from './ChatInput.js'
import { ReasoningStream } from './ReasoningStream.js'
import { SourcesList } from './SourcesList.js'
import { MCPSourceManager } from './MCPSourceManager.js'
import { MCPSourceList } from './MCPSourceList.js'
import { ChatMessage as ChatMessageType, Source, MCPSource, MCPClient } from '../types.js'
import { createMCPClient, detectTransportType, generateChatResponseWithMCP } from '../chatService.js'

interface ChatUIProps {
  initialMessages?: ChatMessageType[]
}

export const ChatUI: React.FC<ChatUIProps> = ({
  initialMessages = [
    {
      role: 'system',
      content:
        'You are a helpful assistant that provides accurate and concise information. You can search the web for up-to-date information when needed and use MCP tools when available.',
    },
  ],
}) => {
  const { exit } = useApp()
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [currentReasoning, setCurrentReasoning] = useState('')
  const [currentResponse, setCurrentResponse] = useState('')
  const [sources, setSources] = useState<Source[]>([])
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [showReasoning, setShowReasoning] = useState(true)
  const [isReasoningComplete, setIsReasoningComplete] = useState(false)

  const [mcpSources, setMcpSources] = useState<MCPSource[]>([])
  const [mcpClients, setMcpClients] = useState<MCPClient[]>([])
  const [showMcpSourceManager, setShowMcpSourceManager] = useState(false)
  const [mcpEnabled, setMcpEnabled] = useState(false)

  useEffect(() => {
    return () => {
      Promise.all(
        mcpClients.map((client) => {
          try {
            return client.client.close()
          } catch (error) {
            console.error(`Error closing MCP client ${client.id}:`, error)
            return Promise.resolve()
          }
        }),
      )
    }
  }, [mcpClients])

  const handleAddMcpSource = async (sourceUrl: string) => {
    try {
      const transportType = detectTransportType(sourceUrl)
      const sourceId = `source_${Date.now()}`

      const newSource: MCPSource = {
        id: sourceId,
        url: sourceUrl,
        transportType,
        status: 'connecting',
      }

      setMcpSources((prev) => [...prev, newSource])

      try {
        const client = await createMCPClient(newSource)

        setMcpSources((prev) => prev.map((source) => (source.id === sourceId ? { ...source, status: 'connected' } : source)))

        setMcpClients((prev) => [...prev, client])

        if (mcpClients.length === 0) {
          setMcpEnabled(true)
        }
      } catch (error) {
        setMcpSources((prev) =>
          prev.map((source) =>
            source.id === sourceId
              ? {
                  ...source,
                  status: 'error',
                  errorMessage: error instanceof Error ? error.message : String(error),
                }
              : source,
          ),
        )
      }
    } catch (error) {
      console.error('Error adding MCP source:', error)
    }
  }

  const handleRemoveMcpSource = (sourceId: string) => {
    const clientToRemove = mcpClients.find((client) => client.id === sourceId)

    if (clientToRemove) {
      try {
        clientToRemove.client.close()
      } catch (error) {
        console.error(`Error closing MCP client ${sourceId}:`, error)
      }

      setMcpClients((prev) => prev.filter((client) => client.id !== sourceId))
    }

    setMcpSources((prev) => prev.filter((source) => source.id !== sourceId))
  }

  useInput((input, key) => {
    // Only handle Ctrl+C for exit, let ChatInput handle everything else
    if (key.ctrl && input === 'c') {
      exit()
    }
  })

  const simulateReasoningStream = async () => {
    const reasoningSteps = [
      'Analyzing the query... ',
      'Searching for relevant information... ',
      'Formulating a comprehensive response based on available data... ',
    ]

    for (const step of reasoningSteps) {
      setCurrentReasoning((prev) => prev + step)
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    setIsReasoningComplete(true)
  }

  const simulateResponseStream = async (response: string) => {
    const words = response.split(' ')
    let fullResponse = ''

    for (const word of words) {
      fullResponse += word + ' '
      setCurrentResponse(fullResponse)
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    return fullResponse
  }

  const handleCommand = (command: string, args: string[]) => {
    switch (command.toLowerCase()) {
      case 'web':
        setWebSearchEnabled((prev) => !prev)
        break
      case 'reasoning':
      case 'r':
        setShowReasoning((prev) => !prev)
        break
      case 'mcp':
      case 'm':
        if (!isLoading) {
          setShowMcpSourceManager((prev) => !prev)
        }
        break
      case 'tools':
      case 't':
        if (!isLoading) {
          setMcpEnabled((prev) => !prev)
        }
        break
      case 'help':
      case 'h':
        const helpMessage: ChatMessageType = {
          role: 'assistant',
          content: `Available commands:
/web - Toggle web search (currently ${webSearchEnabled ? 'enabled' : 'disabled'})
/reasoning or /r - Toggle reasoning display (currently ${showReasoning ? 'enabled' : 'disabled'})
/mcp or /m - Toggle MCP source manager (currently ${showMcpSourceManager ? 'open' : 'closed'})
/tools or /t - Toggle MCP tools (currently ${mcpEnabled ? 'enabled' : 'disabled'})
/help or /h - Show this help message

You can also type numbers (0-9) to remove MCP sources when the manager is open.`,
        }
        setMessages((prev) => [...prev, helpMessage])
        break
      default:
        if (!isLoading && /^[0-9]$/.test(command)) {
          const sourceIndex = parseInt(command, 10)
          if (sourceIndex < mcpSources.length) {
            const sourceToRemove = mcpSources[sourceIndex]
            handleRemoveMcpSource(sourceToRemove.id)
          }
        } else {
          const errorMessage: ChatMessageType = {
            role: 'assistant',
            content: `Unknown command: /${command}. Type /help to see available commands.`,
          }
          setMessages((prev) => [...prev, errorMessage])
        }
        break
    }
  }

  const handleSubmit = async (input: string) => {
    if (!input.trim()) return

    const userMessage: ChatMessageType = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])

    setIsLoading(true)
    setCurrentReasoning('')
    setCurrentResponse('')
    setSources([])
    setIsReasoningComplete(false)

    simulateReasoningStream()

    try {
      if (mcpEnabled && mcpClients.length > 0) {
        console.log('Using MCP tools for response generation...')

        const responseStream = await generateChatResponseWithMCP(messages.concat(userMessage), mcpClients)

        let fullResponse = ''
        let currentSources: Source[] = []

        for await (const part of responseStream) {
          if (part.type === 'reasoning') {
            if (showReasoning) {
              setCurrentReasoning((prev) => prev + part.textDelta)
            }
          } else if (part.type === 'text-delta') {
            fullResponse += part.textDelta
            setCurrentResponse(fullResponse)
          } else if (part.type === 'sources') {
            currentSources = part.sources
            setSources(currentSources)
          }
        }

        const assistantMessage: ChatMessageType = {
          role: 'assistant',
          content: fullResponse.trim(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        let response = ''

        if (input.toLowerCase().includes('mdx')) {
          response = webSearchEnabled
            ? "According to the MDX documentation, MDX is a format that combines Markdown with JSX. It allows you to use JSX in your markdown content. You can import components, such as interactive charts or alerts, and embed them within your content. This makes writing long-form content with components a blast. MDX is commonly used in documentation sites, blogs, and content-heavy applications that benefit from React's component model."
            : 'MDX is a format that combines Markdown with JSX. It allows you to write JSX directly in your Markdown documents, enabling you to include React components within your content. This makes it powerful for creating interactive documentation, blogs, and other content-heavy applications where you want to mix rich content with interactive components.'
        } else {
          response = webSearchEnabled
            ? "I searched the web for information related to your query. The most relevant information I found suggests that your query might be related to JavaScript, React, or web development. Could you provide more specific details about what you're looking for?"
            : "I'm a CLI assistant built with React Ink and simulated OpenAI integration. I can help answer questions and provide information on various topics. For this demo, I work best with questions about MDX, React, or JavaScript."
        }

        const fullResponse = await simulateResponseStream(response)

        if (webSearchEnabled) {
          setSources([
            { title: 'MDX Documentation', url: 'https://mdxjs.com/' },
            { title: 'MDX GitHub Repository', url: 'https://github.com/mdx-js/mdx' },
          ])
        }

        const assistantMessage: ChatMessageType = {
          role: 'assistant',
          content: fullResponse.trim(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error generating response:', error)

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error while generating a response. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box flexDirection='column' padding={1}>
      {/* Header */}
      <Box marginBottom={1} justifyContent='center'>
        <Text bold>MDX Chat CLI {webSearchEnabled && <Text color='cyan'>[Web Search Enabled]</Text>}</Text>
      </Box>

      {/* Controls help text */}
      <Box marginBottom={1}>
        <Text dimColor>
          Use commands: <Text color='cyan'>/web</Text>, <Text color='yellow'>/reasoning</Text>, <Text color='green'>/mcp</Text>,{' '}
          <Text color='magenta'>/tools</Text>, <Text color='white'>/help</Text> | <Text color='red'>Ctrl+C</Text> to exit
        </Text>
      </Box>

      {/* MCP status */}
      {mcpEnabled && (
        <Box marginBottom={1} justifyContent='center'>
          <Text bold color='magenta'>
            [MCP Tools Enabled]
          </Text>
        </Box>
      )}

      {/* MCP source manager */}
      {showMcpSourceManager && (
        <Box flexDirection='column' marginY={1} borderStyle='round' borderColor='green' padding={1}>
          <MCPSourceManager onAddSource={handleAddMcpSource} disabled={isLoading} />
          <MCPSourceList sources={mcpSources} onRemoveSource={handleRemoveMcpSource} />
        </Box>
      )}

      {/* Chat history */}
      <Box flexDirection='column'>
        {messages
          .filter((msg) => msg.role !== 'system')
          .map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
      </Box>

      {/* Reasoning stream */}
      {showReasoning && (currentReasoning || isLoading) && <ReasoningStream reasoning={currentReasoning} isComplete={isReasoningComplete} />}

      {/* Current response being streamed */}
      {currentResponse && isLoading && (
        <Box flexDirection='column' marginY={1}>
          <Text bold color='blue'>
            Assistant:
          </Text>
          <Box marginLeft={2} marginTop={1}>
            <Text>{currentResponse}</Text>
          </Box>
        </Box>
      )}

      {/* Sources list */}
      {sources.length > 0 && <SourcesList sources={sources} />}

      {/* Input box */}
      <ChatInput onSubmit={handleSubmit} onCommand={handleCommand} disabled={isLoading} />
    </Box>
  )
}
