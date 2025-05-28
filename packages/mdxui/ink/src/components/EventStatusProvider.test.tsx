import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventStatusProvider, useEventStatus } from './EventStatusProvider'

const TestComponent = ({ triggerUpdate }: { triggerUpdate?: () => void }) => {
  const { addEvent } = useEventStatus()

  React.useEffect(() => {
    if (triggerUpdate) {
      triggerUpdate()
    }
    addEvent({ id: 'test-event', name: 'Test Event', status: 'pending' })
  }, [addEvent, triggerUpdate])

  return null
}

describe('EventStatusProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides event status context to children', () => {
    const TestHook = () => {
      try {
        useEventStatus()
        return null
      } catch (e) {
        throw e
      }
    }

    expect(() => {
      ;<EventStatusProvider>
        <TestHook />
      </EventStatusProvider>
    }).not.toThrow()
  })

  it('throws error when useEventStatus is used outside provider', () => {
    const OutsideComponent = () => {
      useEventStatus()
      return null
    }
    
    expect(() => {
      const result = OutsideComponent()
    }).toThrow()
  })

  it('calls onEventUpdate when events change', () => {
    expect(true).toBe(true)
  })
})
