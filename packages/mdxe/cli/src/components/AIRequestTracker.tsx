import React from 'react'
import { Box, Text } from 'ink'

// Define a simple progress indicator since we can't import from mdxui/ink directly
const EventProgressIndicator: React.FC<{
  current: number
  total: number
  width?: number
}> = ({ current, total, width = 40 }) => {
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

export interface AIRequest {
  id: string
  functionName: string
  status: 'pending' | 'completed' | 'error'
  startTime: Date
  endTime?: Date
}

interface AIRequestTrackerProps {
  requests: AIRequest[]
}

export const AIRequestTracker: React.FC<AIRequestTrackerProps> = ({ requests }) => {
  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const completedRequests = requests.filter((r) => r.status === 'completed')
  const errorRequests = requests.filter((r) => r.status === 'error')

  return (
    <Box flexDirection='column' marginY={1}>
      <Text color='blue'>AI Request Status:</Text>

      {pendingRequests.length > 0 && (
        <Box flexDirection='column'>
          <Text color='yellow'>Pending ({pendingRequests.length}):</Text>
          {pendingRequests.map((request) => (
            <Text key={request.id}>
              • {request.functionName} (started {request.startTime.toLocaleTimeString()})
            </Text>
          ))}
        </Box>
      )}

      {completedRequests.length > 0 && (
        <Box flexDirection='column'>
          <Text color='green'>Completed ({completedRequests.length}):</Text>
          {completedRequests.slice(-3).map((request) => (
            <Text key={request.id}>✓ {request.functionName}</Text>
          ))}
        </Box>
      )}

      {errorRequests.length > 0 && (
        <Box flexDirection='column'>
          <Text color='red'>Errors ({errorRequests.length}):</Text>
          {errorRequests.slice(-3).map((request) => (
            <Text key={request.id}>✗ {request.functionName}</Text>
          ))}
        </Box>
      )}

      <EventProgressIndicator current={completedRequests.length + errorRequests.length} total={requests.length} width={30} />
    </Box>
  )
}
