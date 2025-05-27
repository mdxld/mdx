#!/usr/bin/env node
import React from 'react'
import { render } from 'ink'
import { ChatUI } from './components/ChatUI.js'
import { ChatMessage } from './types.js'

const initialMessages: ChatMessage[] = [
  {
    role: 'system' as const,
    content: 'You are a helpful assistant that provides accurate and concise information. You can search the web for up-to-date information when needed.',
  },
]

render(<ChatUI initialMessages={initialMessages} />)
