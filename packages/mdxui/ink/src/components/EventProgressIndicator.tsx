import React from 'react'
import { Box, Text } from 'ink'
import { EventProgressIndicatorProps } from './EventStatusTypes'

/**
 * Component to display a progress bar for event processing
 */
export const EventProgressIndicator: React.FC<EventProgressIndicatorProps> = ({ current, total, width = 40 }) => {
  const progress = Math.min(Math.max(0, current / total), 1)
  const filledWidth = Math.floor(progress * width)
  const percentage = Math.round(progress * 100)

  return (
    <Box flexDirection='column' marginY={1}>
      <Box>
        <Text color='blue'>[</Text>
        <Text color='green'>{'='.repeat(filledWidth)}</Text>
        <Text color='gray'>{' '.repeat(width - filledWidth)}</Text>
        <Text color='blue'>]</Text>
        <Text> {percentage}%</Text>
      </Box>
    </Box>
  )
}
