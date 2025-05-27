import React from 'react'
import { Text } from './components'
import { Box } from 'ink'

export interface CardProps {
  title: string
  children: React.ReactNode
  href: string
}

export function Card({ title, children, href }: CardProps) {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="green">
        {title} →
      </Text>
      <Text>
        {children}
      </Text>
      <Text>
        {href}
      </Text>
    </Box>
  )
}
