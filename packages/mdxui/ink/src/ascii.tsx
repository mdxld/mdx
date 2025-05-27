import React from 'react'
import { Text, Box } from 'ink'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const figlet = require('figlet')

interface AsciiProps {
  text: string
  font?: string
  horizontalLayout?: 'default' | 'full' | 'fitted' | 'controlled smushing' | 'universal smushing'
  verticalLayout?: 'default' | 'full' | 'fitted' | 'controlled smushing' | 'universal smushing'
  width?: number
  whitespaceBreak?: boolean
}

/**
 * A component for rendering ASCII art text in the terminal
 * Uses figlet for ASCII art generation
 */
export default function Ascii({
  text,
  font = 'Standard',
  horizontalLayout = 'default',
  verticalLayout = 'default',
  width,
  whitespaceBreak = false,
}: AsciiProps) {
  if (!text) return null

  try {
    const options = {
      font,
      horizontalLayout,
      verticalLayout,
      width,
      whitespaceBreak,
    }

    const asciiArt = figlet.textSync(text, options)

    return (
      <Box flexDirection='column'>
        <Text>{asciiArt}</Text>
      </Box>
    )
  } catch (error) {
    console.error('Error rendering ASCII art:', error)
    return <Text>{text}</Text>
  }
}
