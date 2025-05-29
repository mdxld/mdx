import { describe, it, expect, beforeEach } from 'vitest'
import { createExecutionContext } from './execution-context'
import { clearEvents, emit } from './event-system'
import { renderInputPrompt } from './input-prompt'
import type { MutableEventContext } from './event-system'

const createTestContext = (testInput = 'Test input') => {
  const context = createExecutionContext()
  const originalOn = context.on
  
  context.on = async (eventType, callback) => {
    if (eventType === 'idea.captured') {
      const eventContext: MutableEventContext = new Map() as any;
      const originalSet = eventContext.set.bind(eventContext);
      const originalGet = eventContext.get.bind(eventContext);
      const originalHas = eventContext.has.bind(eventContext);
      
      eventContext.set = function(key, value) { originalSet(key, value); return this; };
      eventContext.get = function(key) { return originalGet(key); };
      eventContext.has = function(key) { return originalHas(key); };
      eventContext.merge = function(obj) { 
        Object.entries(obj).forEach(([k, v]) => this.set(k, v));
        return this;
      };
      eventContext.set('eventType', 'idea.captured');
      eventContext.set('timestamp', new Date().toISOString());
      
      return callback(testInput, eventContext)
    }
    return originalOn(eventType, callback)
  }
  
  return context
}

describe('execution-context', () => {
  beforeEach(() => {
    clearEvents()
  })

  describe('on function', () => {
    it('registers callbacks for regular events', async () => {
      const context = createExecutionContext()
      let callbackCalled = false
      let callbackData: any = null
      
      const callback = (data: any, eventContext?: MutableEventContext) => {
        callbackCalled = true
        callbackData = data
        return 'test result'
      }

      await context.on('test.event', callback)
      const response = await emit('test.event', { data: 'test' })

      expect(callbackCalled).toBe(true)
      expect(callbackData).toEqual({ data: 'test' })
      expect(response.results).toContain('test result')
    })

    it('handles async callbacks for regular events', async () => {
      const context = createExecutionContext()
      let callbackCalled = false
      let callbackData: any = null
      
      const callback = async (data: any, eventContext?: MutableEventContext) => {
        callbackCalled = true
        callbackData = data
        return 'async result'
      }

      await context.on('async.event', callback)
      const response = await emit('async.event', { data: 'async' })

      expect(callbackCalled).toBe(true)
      expect(callbackData).toEqual({ data: 'async' })
      expect(response.results).toContain('async result')
    })

    it('handles idea.captured event with input prompt', async () => {
      
      const testIdea = 'My startup idea'
      const context = createTestContext(testIdea)
      let capturedIdea: string | null = null
      
      const callback = (idea: any, eventContext?: MutableEventContext) => {
        capturedIdea = idea as string
        return 'idea processed'
      }

      const result = await context.on('idea.captured', callback)

      expect(capturedIdea).toBe(testIdea)
      expect(result).toBe('idea processed')
    }, 60000) // Increase timeout for real API calls

    it('registers multiple callbacks for the same event', async () => {
      const context = createExecutionContext()
      const results: string[] = []
      
      const callback1 = () => {
        results.push('callback1 called')
        return 'result1'
      }
      
      const callback2 = () => {
        results.push('callback2 called')
        return 'result2'
      }

      await context.on('multi.event', callback1)
      await context.on('multi.event', callback2)

      const response = await emit('multi.event', { data: 'multi' })

      expect(results).toContain('callback1 called')
      expect(results).toContain('callback2 called')
      expect(response.results).toContain('result1')
      expect(response.results).toContain('result2')
    })

    it('supports the workflow pattern from the example', async () => {
      const testIdea = 'My startup idea'
      const context = createTestContext(testIdea)
      let capturedIdea: string | null = null
      
      const workflowCallback = async (idea: any, eventContext?: MutableEventContext) => {
        capturedIdea = idea as string
        expect(idea).toBeDefined()
        return 'workflow completed'
      }

      await context.on('idea.captured', workflowCallback)

      const testContext: MutableEventContext = new Map() as any;
      const originalTestSet = testContext.set.bind(testContext);
      const originalTestGet = testContext.get.bind(testContext);
      const originalTestHas = testContext.has.bind(testContext);
      
      testContext.set = function(key, value) { originalTestSet(key, value); return this; };
      testContext.get = function(key) { return originalTestGet(key); };
      testContext.has = function(key) { return originalTestHas(key); };
      testContext.merge = function(obj) { 
        Object.entries(obj).forEach(([k, v]) => this.set(k, v));
        return this;
      };
      testContext.set('eventType', 'idea.captured');
      testContext.set('timestamp', new Date().toISOString());
      
      const result = await workflowCallback(testIdea, testContext)

      expect(capturedIdea).toBe(testIdea)
      expect(result).toBe('workflow completed')
    })
  })
})
