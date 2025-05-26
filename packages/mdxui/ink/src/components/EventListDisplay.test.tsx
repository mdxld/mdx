import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { EventListDisplay } from './EventListDisplay';
import { EventStatusItem } from './EventStatus';

describe('EventListDisplay', () => {
  it('renders nothing when events array is empty', () => {
    const { lastFrame } = render(<EventListDisplay events={[]} />);
    expect(lastFrame()).toBe('');
  });

  it('renders a title when provided', () => {
    const events: EventStatusItem[] = [
      {
        id: 'test-event',
        name: 'Test Event',
        status: 'pending'
      }
    ];

    const { lastFrame } = render(<EventListDisplay events={events} title="Event List" />);
    expect(lastFrame()).toContain('Event List');
  });

  it('renders events with different statuses correctly', () => {
    const events: EventStatusItem[] = [
      {
        id: 'pending-event',
        name: 'Pending Event',
        status: 'pending'
      },
      {
        id: 'running-event',
        name: 'Running Event',
        status: 'running'
      },
      {
        id: 'completed-event',
        name: 'Completed Event',
        status: 'completed'
      },
      {
        id: 'failed-event',
        name: 'Failed Event',
        status: 'failed',
        error: 'Something went wrong'
      }
    ];

    const { lastFrame } = render(<EventListDisplay events={events} />);
    const output = lastFrame();
    
    expect(output).toContain('Pending Event');
    expect(output).toContain('Running Event');
    expect(output).toContain('Completed Event');
    expect(output).toContain('Failed Event');
    expect(output).toContain('Something went wrong');
    
    expect(output).toContain('Pending');
    expect(output).toContain('Running');
    expect(output).toContain('Completed');
    expect(output).toContain('Failed');
  });

  it('numbers events sequentially', () => {
    const events: EventStatusItem[] = [
      {
        id: 'event-1',
        name: 'Event 1',
        status: 'completed'
      },
      {
        id: 'event-2',
        name: 'Event 2',
        status: 'running'
      }
    ];

    const { lastFrame } = render(<EventListDisplay events={events} />);
    const output = lastFrame();
    
    expect(output).toContain('1. Event 1');
    expect(output).toContain('2. Event 2');
  });
});
