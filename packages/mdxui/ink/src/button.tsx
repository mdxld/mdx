import React from 'react'
import { PastelBox as Box, Text } from './components'

export type ButtonProps = React.HTMLAttributes<HTMLElement> & {
  variant?: 'primary' | 'secondary' | 'text'
}

export function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  let color = 'white'
  let backgroundColor: string | undefined = 'blue'
  
  switch (variant) {
    case 'secondary':
      color = 'black'
      backgroundColor = 'gray'
      break
    case 'text':
      color = 'blue'
      backgroundColor = undefined
      break
  }
  
  return (
    <Box {...props}>
      <Text color={color} backgroundColor={backgroundColor}> {children} </Text>
    </Box>
  )
}
