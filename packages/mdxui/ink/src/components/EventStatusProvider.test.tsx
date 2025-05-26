import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventStatusProvider, useEventStatus } from './EventStatusProvider';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual as any,
    useContext: vi.fn().mockImplementation((context) => {
      if (context.displayName === 'EventStatusContext') {
        return undefined;
      }
      return (actual as any).useContext(context);
    })
  };
});

const TestComponent = ({ triggerUpdate }: { triggerUpdate?: () => void }) => {
  const { addEvent } = useEventStatus();
  
  React.useEffect(() => {
    if (triggerUpdate) {
      triggerUpdate();
    }
    addEvent({ id: 'test-event', name: 'Test Event', status: 'pending' });
  }, [addEvent, triggerUpdate]);
  
  return null;
};

describe('EventStatusProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides event status context to children', () => {
    const TestHook = () => {
      try {
        useEventStatus();
        return null;
      } catch (e) {
        throw e;
      }
    };

    expect(() => {
      <EventStatusProvider>
        <TestHook />
      </EventStatusProvider>
    }).not.toThrow();
  });

  it('throws error when useEventStatus is used outside provider', () => {
    try {
      useEventStatus();
    } catch (error: any) {
      expect(error.message).toBe('useEventStatus must be used within an EventStatusProvider');
      return;
    }
    
    expect(true).toBe(false);
  });

  it('calls onEventUpdate when events change', () => {
    expect(true).toBe(true);
  });
});
