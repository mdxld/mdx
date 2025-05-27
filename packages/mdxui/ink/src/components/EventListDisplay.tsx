import React from 'react'
import { Box, Text } from 'ink'
import { EventStatusItem, EventListDisplayProps } from './EventStatusTypes'

/**
 * Component to display a list of events with their status
 */
export const EventListDisplay: React.FC<EventListDisplayProps> = ({ events, title }) => {
  if (events.length === 0) {
    return null
  }

  return (
    <Box flexDirection='column' marginY={1}>
      {title && (
        <Text bold color='cyan'>
          {title}
        </Text>
      )}

      {events.map((event, index) => (
        <Box key={event.id} flexDirection='column' marginTop={1} paddingLeft={2}>
          <Text bold>
            {index + 1}. {event.name}
          </Text>

          {event.status === 'completed' ? (
            <Box borderStyle='round' borderColor='green' paddingX={1} marginTop={1}>
              <Text color='green'>✓ Completed</Text>
            </Box>
          ) : event.status === 'failed' ? (
            <Box borderStyle='round' borderColor='red' paddingX={1} marginTop={1}>
              <Text color='red'>✗ Failed: {event.error || 'Unknown error'}</Text>
            </Box>
          ) : event.status === 'running' ? (
            <Box borderStyle='round' borderColor='blue' paddingX={1} marginTop={1}>
              <Text color='blue'>⟳ Running...</Text>
            </Box>
          ) : (
            <Box borderStyle='round' borderColor='gray' paddingX={1} marginTop={1}>
              <Text color='gray'>⦿ Pending</Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
}
