import { describe, it, expect, vi, beforeEach } from 'vitest';
import { on, emit, clearEvents, clearEvent, eventRegistry } from './event-system';

describe('event-system', () => {
  beforeEach(() => {
    clearEvents();
  });

  describe('on', () => {
    it('registers an event handler', () => {
      const callback = vi.fn();
      on('test-event', callback);
      
      const handlers = eventRegistry['handlers'].get('test-event');
      
      expect(handlers).toBeDefined();
      expect(handlers?.length).toBe(1);
      expect(handlers?.[0].callback).toBe(callback);
    });

    it('allows registering multiple handlers for the same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      on('test-event', callback1);
      on('test-event', callback2);
      
      const handlers = eventRegistry['handlers'].get('test-event');
      
      expect(handlers).toBeDefined();
      expect(handlers?.length).toBe(2);
      expect(handlers?.[0].callback).toBe(callback1);
      expect(handlers?.[1].callback).toBe(callback2);
    });
  });

  describe('emit', () => {
    it('calls registered handlers with data', async () => {
      const callback = vi.fn();
      const testData = { message: 'test' };
      
      on('test-event', callback);
      await emit('test-event', testData);
      
      expect(callback).toHaveBeenCalledWith(testData, expect.any(Object));
    });

    it('calls multiple handlers for the same event', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const testData = { message: 'test' };
      
      on('test-event', callback1);
      on('test-event', callback2);
      await emit('test-event', testData);
      
      expect(callback1).toHaveBeenCalledWith(testData, expect.any(Object));
      expect(callback2).toHaveBeenCalledWith(testData, expect.any(Object));
    });

    it('returns results and context from handlers', async () => {
      on('test-event', () => 'result1');
      on('test-event', () => 'result2');
      
      const response = await emit('test-event');
      
      expect(response.results).toEqual(['result1', 'result2']);
      expect(response.context).toBeDefined();
    });

    it('handles async callbacks', async () => {
      on('test-event', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async result';
      });
      
      const response = await emit('test-event');
      
      expect(response.results).toEqual(['async result']);
    });

    it('catches errors in handlers and continues execution', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      on('test-event', () => {
        throw new Error('Test error');
      });
      on('test-event', () => 'success');
      
      const response = await emit('test-event');
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(response.results).toEqual(['success']);
      expect(response.context.errors).toBeDefined();
      expect(response.context.errors.length).toBe(1);
      
      consoleSpy.mockRestore();
    });
    
    it('propagates context between handlers', async () => {
      on('test-event', (data, context) => {
        return { 
          result: 'first handler',
          context: { ...context, firstRan: true }
        };
      });
      
      on('test-event', (data, context) => {
        expect(context.firstRan).toBe(true);
        return {
          result: 'second handler',
          context: { ...context, secondRan: true }
        };
      });
      
      const response = await emit('test-event', { initial: 'data' });
      
      expect(response.context.firstRan).toBe(true);
      expect(response.context.secondRan).toBe(true);
    });
    
    it('preserves initial context', async () => {
      const initialContext = { important: 'value' };
      
      on('test-event', (data, context) => {
        expect(context.important).toBe('value');
        return 'result';
      });
      
      const response = await emit('test-event', 'data', initialContext);
      
      expect(response.context.important).toBe('value');
    });
  });

  describe('clearEvents', () => {
    it('clears all event handlers', () => {
      on('event1', vi.fn());
      on('event2', vi.fn());
      
      clearEvents();
      
      expect(eventRegistry['handlers'].size).toBe(0);
    });
  });

  describe('clearEvent', () => {
    it('clears handlers for a specific event', () => {
      on('event1', vi.fn());
      on('event2', vi.fn());
      
      clearEvent('event1');
      
      expect(eventRegistry['handlers'].has('event1')).toBe(false);
      expect(eventRegistry['handlers'].has('event2')).toBe(true);
    });
  });
});
