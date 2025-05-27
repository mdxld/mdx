import { describe, it, expect, vi, beforeEach } from 'vitest'
import { on, send, emit, clearEvents, clearEvent, eventRegistry, EmitOptions } from './event-system'

describe('event-system', () => {
  beforeEach(() => {
    clearEvents()
  })

  describe('on', () => {
    it('registers an event handler', () => {
      const callback = vi.fn()
      on('test-event', callback)

      const handlers = eventRegistry['handlers'].get('test-event')

      expect(handlers).toBeDefined()
      expect(handlers?.length).toBe(1)
      expect(handlers?.[0].callback).toBe(callback)
    })

    it('allows registering multiple handlers for the same event', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      on('test-event', callback1)
      on('test-event', callback2)

      const handlers = eventRegistry['handlers'].get('test-event')

      expect(handlers).toBeDefined()
      expect(handlers?.length).toBe(2)
      expect(handlers?.[0].callback).toBe(callback1)
      expect(handlers?.[1].callback).toBe(callback2)
    })
  })

  describe('send', () => {
    it('calls registered handlers with data', async () => {
      const callback = vi.fn()
      const testData = { message: 'test' }

      on('test-event', callback)
      await send('test-event', testData)

      expect(callback).toHaveBeenCalledWith(testData, expect.any(Object))
    })

    it('calls multiple handlers for the same event', async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const testData = { message: 'test' }

      on('test-event', callback1)
      on('test-event', callback2)
      await send('test-event', testData)

      expect(callback1).toHaveBeenCalledWith(testData, expect.any(Object))
      expect(callback2).toHaveBeenCalledWith(testData, expect.any(Object))
    })

    it('returns results and context from handlers', async () => {
      on('test-event', () => 'result1')
      on('test-event', () => 'result2')

      const response = await send('test-event')

      expect(response.results).toEqual(['result1', 'result2'])
      expect(response.context).toBeDefined()
    })

    it('handles async callbacks', async () => {
      on('test-event', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 'async result'
      })

      const response = await send('test-event')

      expect(response.results).toEqual(['async result'])
    })

    it('catches errors in handlers and continues execution', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      on('test-event', () => {
        throw new Error('Test error')
      })
      on('test-event', () => 'success')

      const response = await send('test-event')

      expect(consoleSpy).toHaveBeenCalled()
      expect(response.results).toEqual([null, 'success'])
      const errors = response.context.get('errors')
      expect(errors).toBeDefined()
      expect(errors.length).toBe(1)

      consoleSpy.mockRestore()
    })

    it('propagates context between handlers', async () => {
      on('test-event', (data, context) => {
        return {
          result: 'first handler',
          context: { ...context, firstRan: true },
        }
      })

      on('test-event', (data, context) => {
        expect(context?.firstRan).toBe(true)
        return {
          result: 'second handler',
          context: { ...(context || {}), secondRan: true },
        }
      })

      const response = await send('test-event', { initial: 'data' })

      expect(response.context.firstRan).toBe(true)
      expect(response.context.secondRan).toBe(true)
    })

    it('preserves initial context', async () => {
      const initialContext = { important: 'value' }

      on('test-event', (data, context) => {
        expect(context?.important).toBe('value')
        return 'result'
      })

      const response = await send('test-event', 'data', initialContext)

      expect(response.context.important).toBe('value')
    })
    it('supports direct context modification with helper methods', async () => {
      on('test-event', (data, context) => {
        context?.set('step1', 'completed')
        context?.merge({ processed: { step1: true } })
        return 'result1'
      })

      on('test-event', (data, context) => {
        expect(context?.get('step1')).toBe('completed')
        expect(context?.has('processed')).toBe(true)
        context?.set('step2', 'completed')
        return 'result2'
      })

      const response = await send('test-event', { test: 'data' })

      expect(response.context.get('step1')).toBe('completed')
      expect(response.context.get('step2')).toBe('completed')
      expect(response.context.processed.step1).toBe(true)
    })

    it('performs deep merging of complex objects', async () => {
      on('test-event', (data, context) => {
        context?.merge({
          user: { name: 'John', preferences: { theme: 'dark' } },
          settings: { lang: 'en' },
        })
        return 'result1'
      })

      on('test-event', (data, context) => {
        context?.merge({
          user: { age: 30, preferences: { notifications: true } },
          settings: { timezone: 'UTC' },
        })
        return 'result2'
      })

      const response = await send('test-event')

      expect(response.context.user.name).toBe('John')
      expect(response.context.user.age).toBe(30)
      expect(response.context.user.preferences.theme).toBe('dark')
      expect(response.context.user.preferences.notifications).toBe(true)
      expect(response.context.settings.lang).toBe('en')
      expect(response.context.settings.timezone).toBe('UTC')
    })

    it('maintains backward compatibility with return-based context', async () => {
      on('test-event', (data, context) => {
        return {
          result: 'legacy',
          context: { legacyStyle: true },
        }
      })

      on('test-event', (data, context) => {
        expect(context?.get('legacyStyle')).toBe(true)
        context?.set('modernStyle', true)
        return 'modern'
      })

      const response = await send('test-event')

      expect(response.context.get('legacyStyle')).toBe(true)
      expect(response.context.get('modernStyle')).toBe(true)
    })
  })

  describe('enhanced async error handling', () => {
    it('provides detailed error context for async handler failures', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      on('test-event', async () => {
        throw new Error('Async handler error')
      })

      const response = await send('test-event', { testData: 'value' })

      const errors = response.context.get('errors')
      expect(errors).toBeDefined()
      expect(errors.length).toBe(1)

      const error = errors[0]
      expect(error.event).toBe('test-event')
      expect(error.handlerIndex).toBe(0)
      expect(error.error.message).toBe('Async handler error')
      expect(error.error.stack).toBeDefined()
      expect(error.timestamp).toBeDefined()
      expect(error.data).toBeDefined()

      consoleSpy.mockRestore()
    })

    it('emits error events for centralized error handling', async () => {
      const errorHandler = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      on('handler.error', errorHandler)
      on('test-event', async () => {
        throw new Error('Test error for centralized handling')
      })

      await send('test-event')

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'test-event',
          error: expect.objectContaining({
            message: 'Test error for centralized handling',
          }),
        }),
        expect.any(Object),
      )

      consoleSpy.mockRestore()
    })

    it('handles nested async operations with proper error isolation', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      on('test-event', async () => {
        for (let i = 0; i < 3; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1))
          if (i === 1) {
            throw new Error(`Nested error at iteration ${i}`)
          }
        }
        return 'should not reach here'
      })

      on('test-event', async () => {
        return 'second handler success'
      })

      const response = await send('test-event')

      expect(response.results).toEqual([null, 'second handler success'])
      const errors = response.context.get('errors')
      expect(errors.length).toBe(1)
      expect(errors[0].error.message).toBe('Nested error at iteration 1')

      consoleSpy.mockRestore()
    })

    it('supports handler timeouts', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      on('test-event', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return 'slow handler'
      })

      const options: EmitOptions = { timeout: 10 }
      const response = await send('test-event', null, {}, options)

      expect(response.results).toEqual([null])
      const errors = response.context.get('errors')
      expect(errors.length).toBe(1)
      expect(errors[0].error.message).toContain('timeout')

      consoleSpy.mockRestore()
    })

    it('supports parallel execution of handlers', async () => {
      const startTime = Date.now()

      on('test-event', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return 'handler 1'
      })

      on('test-event', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return 'handler 2'
      })

      on('test-event', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return 'handler 3'
      })

      const options: EmitOptions = { parallel: true }
      const response = await send('test-event', null, {}, options)

      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(150) // Allow some buffer for test overhead
      expect(response.results).toEqual(['handler 1', 'handler 2', 'handler 3'])
    })

    it('handles errors in parallel execution', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      on('test-event', async () => {
        throw new Error('Error in first handler')
      })

      on('test-event', async () => {
        return 'second handler success'
      })

      const options: EmitOptions = { parallel: true }
      const response = await send('test-event', null, {}, options)

      expect(response.results).toEqual([null, 'second handler success'])
      const errors = response.context.get('errors')
      expect(errors.length).toBe(1)
      expect(errors[0].error.message).toBe('Error in first handler')

      consoleSpy.mockRestore()
    })
  })

  describe('clearEvents', () => {
    it('clears all event handlers', () => {
      on('event1', vi.fn())
      on('event2', vi.fn())

      clearEvents()

      expect(eventRegistry['handlers'].size).toBe(0)
    })
  })

  describe('clearEvent', () => {
    it('clears handlers for a specific event', () => {
      on('event1', vi.fn())
      on('event2', vi.fn())

      clearEvent('event1')

      expect(eventRegistry['handlers'].has('event1')).toBe(false)
      expect(eventRegistry['handlers'].has('event2')).toBe(true)
    })
  })

  describe('execution context integration', () => {
    it('exposes send function through execution context', async () => {
      const { createExecutionContext } = await import('./execution-context')
      const context = createExecutionContext()

      expect(context.send).toBeDefined()
      expect(typeof context.send).toBe('function')
    })

    it('allows sending events from execution context', async () => {
      const { createExecutionContext } = await import('./execution-context')
      const context = createExecutionContext()

      const callback = vi.fn()
      context.on('test-event', callback)

      await context.send('test-event', { message: 'test data' })

      expect(callback).toHaveBeenCalledWith({ message: 'test data' }, expect.any(Object))
    })

    it('supports async callbacks through execution context', async () => {
      const { createExecutionContext } = await import('./execution-context')
      const context = createExecutionContext()

      context.on('async-event', async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return `processed: ${data.value}`
      })

      const result = await context.send('async-event', { value: 'test' })

      expect(result.results).toEqual(['processed: test'])
    })
  })
})
