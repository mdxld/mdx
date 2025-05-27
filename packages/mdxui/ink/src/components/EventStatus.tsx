import React from 'react'
import { Box, Text } from 'ink'
import Spinner from './react-ink/Spinner'
import { EventStatusItem, EventStatusProps } from './EventStatusTypes'

/**
 * Component to display the status of an individual event
 */
export const EventStatusItemComponent: React.FC<{
  item: EventStatusItem
  level?: number
}> = ({ item, level = 0 }) => {
  const { id, name, status, error, children } = item
  const indent = level * 2

  const getStatusIndicator = () => {
    switch (status) {
      case 'pending':
        return <Text color='gray'>⦿</Text>
      case 'running':
        return <Spinner type='dots' />
      case 'completed':
        return <Text color='green'>✓</Text>
      case 'failed':
        return <Text color='red'>✗</Text>
      default:
        return <Text>•</Text>
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'gray'
      case 'running':
        return 'blue'
      case 'completed':
        return 'green'
      case 'failed':
        return 'red'
      default:
        return undefined
    }
  }

  return (
    <Box flexDirection='column'>
      <Box paddingLeft={indent}>
        {getStatusIndicator()}
        <Text color={getStatusColor()} bold={status === 'running'}>
          {' '}
          {name}
        </Text>
      </Box>

      {error && (
        <Box paddingLeft={indent + 2}>
          <Text color='red'>{error}</Text>
        </Box>
      )}

      {children && children.length > 0 && (
        <Box flexDirection='column'>
          {children.map((child) => (
            <EventStatusItemComponent key={child.id} item={child} level={level + 1} />
          ))}
        </Box>
      )}
    </Box>
  )
}

/**
 * Component to display the status of multiple events
 */
export const EventStatus: React.FC<EventStatusProps> = ({ events, title }) => {
  if (events.length === 0) {
    return null
  }

  return (
    <Box flexDirection='column' marginY={1}>
      {title && (
        <Box marginBottom={1}>
          <Text bold>{title}</Text>
        </Box>
      )}

      <Box flexDirection='column'>
        {events.map((event) => (
          <EventStatusItemComponent key={event.id} item={event} />
        ))}
      </Box>
    </Box>
  )
}
