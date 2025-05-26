import { describe, it, expect, vi, beforeEach } from 'vitest';
import { on, emit, clearEvents, clearEvent, eventRegistry, EmitOptions } from './event-system';

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
      expect(response.results).toEqual([null, 'success']);
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
        expect(context?.firstRan).toBe(true);
        return {
          result: 'second handler',
          context: { ...(context || {}), secondRan: true }
        };
      });
      
      const response = await emit('test-event', { initial: 'data' });
      
      expect(response.context.firstRan).toBe(true);
      expect(response.context.secondRan).toBe(true);
    });
    
    it('preserves initial context', async () => {
      const initialContext = { important: 'value' };
      
      on('test-event', (data, context) => {
        expect(context?.important).toBe('value');
        return 'result';
      });
      
      const response = await emit('test-event', 'data', initialContext);
      
      expect(response.context.important).toBe('value');
    });
  });

  describe('enhanced async error handling', () => {
    it('provides detailed error context for async handler failures', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      on('test-event', async () => {
        throw new Error('Async handler error');
      });
      
      const response = await emit('test-event', { testData: 'value' });
      
      expect(response.context.errors).toBeDefined();
      expect(response.context.errors.length).toBe(1);
      
      const error = response.context.errors[0];
      expect(error.event).toBe('test-event');
      expect(error.handlerIndex).toBe(0);
      expect(error.error.message).toBe('Async handler error');
      expect(error.error.stack).toBeDefined();
      expect(error.timestamp).toBeDefined();
      expect(error.data).toBeDefined();
      
      consoleSpy.mockRestore();
    });

    it('emits error events for centralized error handling', async () => {
      const errorHandler = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      on('handler.error', errorHandler);
      on('test-event', async () => {
        throw new Error('Test error for centralized handling');
      });
      
      await emit('test-event');
      
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'test-event',
          error: expect.objectContaining({
            message: 'Test error for centralized handling'
          })
        }),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });

    it('handles nested async operations with proper error isolation', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      on('test-event', async () => {
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 1));
          if (i === 1) {
            throw new Error(`Nested error at iteration ${i}`);
          }
        }
        return 'should not reach here';
      });
      
      on('test-event', async () => {
        return 'second handler success';
      });
      
      const response = await emit('test-event');
      
      expect(response.results).toEqual([null, 'second handler success']);
      expect(response.context.errors.length).toBe(1);
      expect(response.context.errors[0].error.message).toBe('Nested error at iteration 1');
      
      consoleSpy.mockRestore();
    });

    it('supports handler timeouts', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      on('test-event', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'slow handler';
      });
      
      const options: EmitOptions = { timeout: 10 };
      const response = await emit('test-event', null, {}, options);
      
      expect(response.results).toEqual([null]);
      expect(response.context.errors.length).toBe(1);
      expect(response.context.errors[0].error.message).toContain('timeout');
      
      consoleSpy.mockRestore();
    });

    it('supports parallel execution of handlers', async () => {
      const startTime = Date.now();
      
      on('test-event', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'handler 1';
      });
      
      on('test-event', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'handler 2';
      });
      
      on('test-event', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'handler 3';
      });
      
      const options: EmitOptions = { parallel: true };
      const response = await emit('test-event', null, {}, options);
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(150); // Allow some buffer for test overhead
      expect(response.results).toEqual(['handler 1', 'handler 2', 'handler 3']);
    });

    it('handles errors in parallel execution', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      on('test-event', async () => {
        throw new Error('Error in first handler');
      });
      
      on('test-event', async () => {
        return 'second handler success';
      });
      
      const options: EmitOptions = { parallel: true };
      const response = await emit('test-event', null, {}, options);
      
      expect(response.results).toEqual([null, 'second handler success']);
      expect(response.context.errors.length).toBe(1);
      expect(response.context.errors[0].error.message).toBe('Error in first handler');
      
      consoleSpy.mockRestore();
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
