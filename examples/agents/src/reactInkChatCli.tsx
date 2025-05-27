import React from 'react'
import { render } from 'ink'
import { ChatUI } from './components/ChatUI.js'
import { ChatMessage } from './types.js'

/**
 * React Ink-based chat CLI that uses OpenAI o4 with web search enabled and streaming thinking
 *
 * Features:
 * - Interactive chat interface built with React Ink
 * - Simulated OpenAI o4-mini integration with detailed reasoning
 * - Web search capability with source citation
 * - Streaming responses with visible reasoning process
 * - Maintains chat history between interactions
 *
 * Usage:
 * - Press 'w' to toggle web search
 * - Press 'r' to toggle reasoning display
 * - Press 'Ctrl+C' to exit
 */

const initialMessages: ChatMessage[] = [
  {
    role: 'system',
    content: 'You are a helpful assistant that provides accurate and concise information. You can search the web for up-to-date information when needed.',
  },
]

console.log('\n🚀 Starting MDX Chat CLI...\n')
console.log('This is a demonstration of a React Ink-based chat CLI that simulates OpenAI o4 integration')
console.log('with web search capability and streaming reasoning.\n')

render(<ChatUI initialMessages={initialMessages} />)

export { ChatUI }
