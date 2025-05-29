import { describe, it, expect, beforeEach } from 'vitest'
import { on, send, emit, clearEvents, clearEvent, eventRegistry, EmitOptions, MutableEventContext } from './event-system'

describe('event-system', () => {
  beforeEach(() => {
    clearEvents()
  })

  describe('on', () => {
    it('registers an event handler', () => {
      let handlerCalled = false
      const callback = () => { handlerCalled = true }
      on('test-event', callback)

      const handlers = eventRegistry['handlers'].get('test-event')

      expect(handlers).toBeDefined()
      expect(handlers?.length).toBe(1)
      expect(handlers?.[0].callback).toBe(callback)
    })

    it('allows registering multiple handlers for the same event', () => {
      const callback1 = () => 'result1'
      const callback2 = () => 'result2'

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
      let receivedData = null
      const testData = { message: 'test' }

      on('test-event', (data) => {
        receivedData = data
        return 'handler called'
      })
      
      await send('test-event', testData)

      expect(receivedData).toEqual(testData)
    })

    it('calls multiple handlers for the same event', async () => {
      const calledHandlers: string[] = []
      const testData = { message: 'test' }

      on('test-event', (data) => {
        calledHandlers.push('handler1')
        return 'result1'
      })
      
      on('test-event', (data) => {
        calledHandlers.push('handler2')
        return 'result2'
      })
      
      await send('test-event', testData)

      expect(calledHandlers).toContain('handler1')
      expect(calledHandlers).toContain('handler2')
      expect(calledHandlers.length).toBe(2)
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
      const errorMessages: string[] = []
      const originalConsoleError = console.error
      console.error = (...args) => {
        errorMessages.push(args.join(' '))
      }

      try {
        on('test-event', () => {
          throw new Error('Test error')
        })
        on('test-event', () => 'success')

        const response = await send('test-event')

        expect(errorMessages.length).toBeGreaterThan(0)
        expect(errorMessages[0]).toContain('Test error')
        expect(response.results).toEqual([null, 'success'])
        const errors = response.context.get('errors')
        expect(errors).toBeDefined()
        expect(errors.length).toBe(1)
      } finally {
        console.error = originalConsoleError
      }
    })

    it('propagates context between handlers', async () => {
      let firstRanValue = false
      let secondRanValue = false
      
      on('test-event', (data, context) => {
        context?.set('firstRan', true)
        return 'first handler'
      })

      on('test-event', (data, context) => {
        firstRanValue = context?.get('firstRan') === true
        context?.set('secondRan', true)
        return 'second handler'
      })

      const response = await send('test-event', { initial: 'data' })

      secondRanValue = response.context.get('secondRan') === true
      expect(firstRanValue).toBe(true)
      expect(secondRanValue).toBe(true)
    })

    it('preserves initial context', async () => {
      let importantValue = null
      const initialContext = new MutableEventContext()
      initialContext.set('important', 'value')

      on('test-event', (data, context) => {
        importantValue = context?.get('important')
        return 'result'
      })

      const response = await send('test-event', 'data', initialContext)

      expect(importantValue).toBe('value')
      expect(response.context.get('important')).toBe('value')
    })
    
    it('supports direct context modification with helper methods', async () => {
      let step1Value = null
      let hasProcessed = false
      
      on('test-event', (data, context) => {
        context?.set('step1', 'completed')
        context?.merge({ processed: { step1: true } })
        return 'result1'
      })

      on('test-event', (data, context) => {
        step1Value = context?.get('step1')
        hasProcessed = context?.has('processed') || false
        context?.set('step2', 'completed')
        return 'result2'
      })

      const response = await send('test-event', { test: 'data' })

      expect(step1Value).toBe('completed')
      expect(hasProcessed).toBe(true)
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
      let legacyStyleValue = false
      
      on('test-event', (data, context) => {
        return {
          result: 'legacy',
          context: { legacyStyle: true },
        }
      })

      on('test-event', (data, context) => {
        legacyStyleValue = context?.get('legacyStyle') === true
        context?.set('modernStyle', true)
        return 'modern'
      })

      const response = await send('test-event')

      expect(legacyStyleValue).toBe(true)
      expect(response.context.get('legacyStyle')).toBe(true)
      expect(response.context.get('modernStyle')).toBe(true)
    })
  })

  describe('enhanced async error handling', () => {
    it('provides detailed error context for async handler failures', async () => {
      const errorMessages = []
      const originalConsoleError = console.error
      console.error = (...args) => {
        errorMessages.push(args.join(' '))
      }

      try {
        on('test-event', async () => {
          throw new Error('Async handler error')
        })

        const response = await send('test-event', { testData: 'value' })

        expect(errorMessages.length).toBeGreaterThan(0)
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
      } finally {
        console.error = originalConsoleError
      }
    })

    it('emits error events for centralized error handling', async () => {
      let errorHandlerCalled = false
      let errorEventData: any = null
      
      const errorMessages: string[] = []
      const originalConsoleError = console.error
      console.error = (...args) => {
        errorMessages.push(args.join(' '))
      }

      try {
        on('handler.error', (data) => {
          errorHandlerCalled = true
          errorEventData = data
        })
        
        on('test-event', async () => {
          throw new Error('Test error for centralized handling')
        })

        await send('test-event')

        expect(errorHandlerCalled).toBe(true)
        expect(errorEventData).toBeDefined()
        expect(errorEventData.event).toBe('test-event')
        expect(errorEventData.error.message).toBe('Test error for centralized handling')
      } finally {
        console.error = originalConsoleError
      }
    })

    it('handles nested async operations with proper error isolation', async () => {
      const errorMessages = []
      const originalConsoleError = console.error
      console.error = (...args) => {
        errorMessages.push(args.join(' '))
      }

      try {
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

        expect(errorMessages.length).toBeGreaterThan(0)
        expect(response.results).toEqual([null, 'second handler success'])
        const errors = response.context.get('errors')
        expect(errors.length).toBe(1)
        expect(errors[0].error.message).toBe('Nested error at iteration 1')
      } finally {
        console.error = originalConsoleError
      }
    })

    it('supports handler timeouts', async () => {
      const errorMessages = []
      const originalConsoleError = console.error
      console.error = (...args) => {
        errorMessages.push(args.join(' '))
      }

      try {
        on('test-event', async () => {
          await new Promise((resolve) => setTimeout(resolve, 50))
          return 'slow handler'
        })

        const options: EmitOptions = { timeout: 10 }
        const response = await send('test-event', null, {}, options)

        expect(errorMessages.length).toBeGreaterThan(0)
        expect(response.results).toEqual([null])
        const errors = response.context.get('errors')
        expect(errors.length).toBe(1)
        expect(errors[0].error.message).toContain('timeout')
      } finally {
        console.error = originalConsoleError
      }
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
      const errorMessages = []
      const originalConsoleError = console.error
      console.error = (...args) => {
        errorMessages.push(args.join(' '))
      }

      try {
        on('test-event', async () => {
          throw new Error('Error in first handler')
        })

        on('test-event', async () => {
          return 'second handler success'
        })

        const options: EmitOptions = { parallel: true }
        const response = await send('test-event', null, {}, options)

        expect(errorMessages.length).toBeGreaterThan(0)
        expect(response.results).toEqual([null, 'second handler success'])
        const errors = response.context.get('errors')
        expect(errors.length).toBe(1)
        expect(errors[0].error.message).toBe('Error in first handler')
      } finally {
        console.error = originalConsoleError
      }
    })
  })

  describe('clearEvents', () => {
    it('clears all event handlers', () => {
      on('event1', () => 'result1')
      on('event2', () => 'result2')

      clearEvents()

      expect(eventRegistry['handlers'].size).toBe(0)
    })
  })

  describe('clearEvent', () => {
    it('clears handlers for a specific event', () => {
      on('event1', () => 'result1')
      on('event2', () => 'result2')

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

      let callbackCalled = false
      let receivedData = null
      
      context.on('test-event', (data) => {
        callbackCalled = true
        receivedData = data
        return 'callback result'
      })

      await context.send('test-event', { message: 'test data' })

      expect(callbackCalled).toBe(true)
      expect(receivedData).toEqual({ message: 'test data' })
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
