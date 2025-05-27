import React from 'react'
import { render } from 'ink-testing-library'
import { describe, it, expect } from 'vitest'
import { EventStatus } from './EventStatus'
import { EventStatusItem } from './EventStatusTypes'

describe('EventStatus', () => {
  it('renders nothing when events array is empty', () => {
    const { lastFrame } = render((<EventStatus events={[]} />) as any)
    expect(lastFrame()).toBe('')
  })

  it('renders a title when provided', () => {
    const events: EventStatusItem[] = [
      {
        id: 'test-event',
        name: 'Test Event',
        status: 'pending',
      },
    ]

    const { lastFrame } = render((<EventStatus events={events} title='Event Status' />) as any)
    expect(lastFrame()).toContain('Event Status')
  })

  it('renders events with different statuses correctly', () => {
    const events: EventStatusItem[] = [
      {
        id: 'pending-event',
        name: 'Pending Event',
        status: 'pending',
      },
      {
        id: 'running-event',
        name: 'Running Event',
        status: 'running',
      },
      {
        id: 'completed-event',
        name: 'Completed Event',
        status: 'completed',
      },
      {
        id: 'failed-event',
        name: 'Failed Event',
        status: 'failed',
        error: 'Something went wrong',
      },
    ]

    const { lastFrame } = render((<EventStatus events={events} />) as any)
    const output = lastFrame()

    expect(output).toContain('Pending Event')
    expect(output).toContain('Running Event')
    expect(output).toContain('Completed Event')
    expect(output).toContain('Failed Event')
    expect(output).toContain('Something went wrong')
  })

  it('renders nested events correctly', () => {
    const events: EventStatusItem[] = [
      {
        id: 'parent-event',
        name: 'Parent Event',
        status: 'running',
        children: [
          {
            id: 'child-event-1',
            name: 'Child Event 1',
            status: 'completed',
          },
          {
            id: 'child-event-2',
            name: 'Child Event 2',
            status: 'running',
          },
        ],
      },
    ]

    const { lastFrame } = render((<EventStatus events={events} />) as any)
    const output = lastFrame()

    expect(output).toContain('Parent Event')
    expect(output).toContain('Child Event 1')
    expect(output).toContain('Child Event 2')
  })
})
