import React from 'react'
import { Text, Box } from 'ink'
import { marked } from 'marked'
// @ts-ignore - Type issues with marked-terminal
import TerminalRenderer from 'marked-terminal'

const renderer = new TerminalRenderer({
  width: 100,
  reflowText: true,
  showSectionPrefix: false,
  unescape: true,
  code: (code: string, lang: string) => {
    return code
  },
  heading: (text: string, level: number) => {
    const prefix = '#'.repeat(level) + ' '
    return level <= 2 ? `\n${prefix}${text}\n` : `${prefix}${text}\n`
  },
  list: (body: string, ordered: boolean) => {
    return `\n${body}\n`
  },
  listitem: (text: string) => {
    return `  • ${text}\n`
  },
  strong: (text: string) => {
    return `*${text}*`
  },
  em: (text: string) => {
    return `_${text}_`
  },
  link: (href: string, title: string, text: string) => {
    return `${text} (${href})`
  },
  blockquote: (quote: string) => {
    return `\n  > ${quote.replace(/\n/g, '\n  > ')}\n`
  },
  table: (header: string, body: string) => {
    return `\n${header}${body}\n`
  },
})

// @ts-ignore - Type compatibility issues with marked-terminal
marked.setOptions({ renderer })

interface MarkdownProps {
  children: string
}

/**
 * A rich Markdown component for terminal rendering
 * Uses marked and marked-terminal for full markdown support
 */
export default function Markdown({ children }: MarkdownProps) {
  if (!children) return null

  try {
    const renderedMarkdown = marked(children)

    return (
      <Box flexDirection='column' paddingX={1}>
        <Text>{renderedMarkdown.toString()}</Text>
      </Box>
    )
  } catch (error) {
    console.error('Error rendering markdown:', error)
    return <Text>{children}</Text>
  }
}
