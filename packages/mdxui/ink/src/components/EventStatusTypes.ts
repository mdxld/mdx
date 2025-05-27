import React from 'react'

/**
 * Interface for an individual event status item
 */
export interface EventStatusItem {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  error?: string
  children?: EventStatusItem[]
  startTime?: Date
  endTime?: Date
}

/**
 * Props for the EventStatus component
 */
export interface EventStatusProps {
  events: EventStatusItem[]
  title?: string
}

/**
 * Props for the EventProgressIndicator component
 */
export interface EventProgressIndicatorProps {
  current: number
  total: number
  width?: number
}

/**
 * Props for the EventListDisplay component
 */
export interface EventListDisplayProps {
  events: EventStatusItem[]
  title?: string
}

/**
 * Props for the EventStatusProvider component
 */
export interface EventStatusProviderProps {
  children: React.ReactNode
  onEventUpdate?: (events: EventStatusItem[]) => void
}

/**
 * Props for the EventSystemConnector component
 */
export interface EventSystemConnectorProps {
  children: React.ReactNode
  eventRegistry: any
}
