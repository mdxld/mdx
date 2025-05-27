import React, { useState, useEffect, useContext, createContext } from 'react'
import { Box } from 'ink'
import { EventStatusItem, EventStatusProviderProps, EventSystemConnectorProps } from './EventStatusTypes'

/**
 * Context for event status
 */
interface EventStatusContextType {
  events: EventStatusItem[]
  addEvent: (event: Omit<EventStatusItem, 'startTime'>) => string
  updateEvent: (id: string, updates: Partial<EventStatusItem>) => void
  completeEvent: (id: string, error?: string) => void
  getEvent: (id: string) => EventStatusItem | undefined
  clearEvents: () => void
}

const EventStatusContext = createContext<EventStatusContextType | undefined>(undefined)
EventStatusContext.displayName = 'EventStatusContext'

/**
 * Provider component for event status
 */
export const EventStatusProvider: React.FC<EventStatusProviderProps> = ({ children, onEventUpdate }) => {
  const [events, setEvents] = useState<EventStatusItem[]>([])

  const findEventById = (eventId: string, eventList: EventStatusItem[] = events): { event: EventStatusItem; path: number[] } | undefined => {
    for (let i = 0; i < eventList.length; i++) {
      const event = eventList[i]
      if (event.id === eventId) {
        return { event, path: [i] }
      }

      if (event.children && event.children.length > 0) {
        const childResult = findEventById(eventId, event.children)
        if (childResult) {
          return {
            event: childResult.event,
            path: [i, ...childResult.path],
          }
        }
      }
    }

    return undefined
  }

  const updateEventAtPath = (path: number[], updates: Partial<EventStatusItem>, eventList: EventStatusItem[]): EventStatusItem[] => {
    if (path.length === 0) return eventList

    const newList = [...eventList]
    let current = newList
    let target: any = null

    for (let i = 0; i < path.length - 1; i++) {
      const index = path[i]
      if (!current[index].children) {
        current[index].children = []
      }
      current = current[index].children!
    }

    const lastIndex = path[path.length - 1]
    current[lastIndex] = {
      ...current[lastIndex],
      ...updates,
    }

    return newList
  }

  const addEvent = (event: Omit<EventStatusItem, 'startTime'>): string => {
    const newEvent: EventStatusItem = {
      ...event,
      startTime: new Date(),
      status: event.status || 'pending',
    }

    setEvents((prevEvents) => {
      if (event.id.includes('.')) {
        const parentId = event.id.split('.').slice(0, -1).join('.')
        const parentResult = findEventById(parentId, prevEvents)

        if (parentResult) {
          const { path } = parentResult
          return updateEventAtPath(
            path,
            {
              children: [...(parentResult.event.children || []), newEvent],
            },
            prevEvents,
          )
        }
      }

      return [...prevEvents, newEvent]
    })

    return event.id
  }

  const updateEvent = (id: string, updates: Partial<EventStatusItem>) => {
    setEvents((prevEvents) => {
      const result = findEventById(id, prevEvents)
      if (!result) return prevEvents

      return updateEventAtPath(result.path, updates, prevEvents)
    })
  }

  const completeEvent = (id: string, error?: string) => {
    setEvents((prevEvents) => {
      const result = findEventById(id, prevEvents)
      if (!result) return prevEvents

      return updateEventAtPath(
        result.path,
        {
          status: error ? 'failed' : 'completed',
          error,
          endTime: new Date(),
        },
        prevEvents,
      )
    })
  }

  const getEvent = (id: string): EventStatusItem | undefined => {
    const result = findEventById(id)
    return result?.event
  }

  const clearEvents = () => {
    setEvents([])
  }

  useEffect(() => {
    if (onEventUpdate) {
      onEventUpdate(events)
    }
  }, [events, onEventUpdate])

  const contextValue: EventStatusContextType = {
    events,
    addEvent,
    updateEvent,
    completeEvent,
    getEvent,
    clearEvents,
  }

  return <EventStatusContext.Provider value={contextValue}>{children}</EventStatusContext.Provider>
}

/**
 * Hook to use event status context
 */
export const useEventStatus = () => {
  const context = useContext(EventStatusContext)
  if (!context) {
    throw new Error('useEventStatus must be used within an EventStatusProvider')
  }
  return context
}

/**
 * Component that connects to the event system
 */

export const EventSystemConnector: React.FC<EventSystemConnectorProps> = ({ children, eventRegistry }) => {
  const { addEvent, updateEvent, completeEvent } = useEventStatus()

  useEffect(() => {
    const originalEmit = eventRegistry.emit

    eventRegistry.emit = async (event: string, data?: any, context: any = {}) => {
      const existingEvent = findEventById(event)

      if (!existingEvent) {
        addEvent({
          id: event,
          name: event,
          status: 'running',
        })
      } else {
        updateEvent(event, { status: 'running' })
      }

      try {
        const result = await originalEmit(event, data, context)

        completeEvent(event)

        return result
      } catch (error) {
        completeEvent(event, error instanceof Error ? error.message : String(error))
        throw error
      }
    }

    return () => {
      eventRegistry.emit = originalEmit
    }
  }, [eventRegistry, addEvent, updateEvent, completeEvent])

  return <>{children}</>
}

const findEventById = (eventId: string): EventStatusItem | undefined => {
  const context = useContext(EventStatusContext)
  if (!context) return undefined

  const result = context.getEvent(eventId)
  return result
}
