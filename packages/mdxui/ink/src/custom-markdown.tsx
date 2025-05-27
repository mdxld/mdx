import React from 'react'
import type { FC } from 'react'
import { Text } from 'ink'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const marked = require('marked')

export default function CustomMarkdown({ children }: { children: string }) {
  if (!children) return null

  const content = children
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/`(.*?)`/g, '$1') // Code
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)') // Links

  return <Text>{content}</Text>
}
