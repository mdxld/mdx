import { describe, it, expect, beforeEach } from 'vitest'
import { 
  on, 
  send, 
  emit,
  clearEvents,
  clearEvent,
  MutableEventContext,
  createEnhancedContext,
  onWithAI,
  sendWithAI
} from '../src/index'

describe('ai-workflows', () => {
  beforeEach(() => {
    clearEvents()
  })

  describe('basic event system', () => {
    it('should register and trigger event handlers', async () => {
      let called = false
      let receivedData: any = null

      on('test.event', (data) => {
        called = true
        receivedData = data
        return { success: true }
      })

      const result = await send('test.event', { message: 'hello' })
      
      expect(called).toBe(true)
      expect(receivedData).toEqual({ message: 'hello' })
      expect(result.results).toHaveLength(1)
      expect(result.results[0]).toEqual({ success: true })
    })

    it('should support multiple handlers for the same event', async () => {
      const calls: number[] = []

      on('multi.test', () => {
        calls.push(1)
        return 'first'
      })

      on('multi.test', () => {
        calls.push(2)
        return 'second'
      })

      const result = await send('multi.test')
      
      expect(calls).toEqual([1, 2])
      expect(result.results).toEqual(['first', 'second'])
    })

    it('should propagate context between handlers', async () => {
      on('context.test', (data, context) => {
        context?.set('step1', 'completed')
        return 'handler1'
      })

      on('context.test', (data, context) => {
        const step1 = context?.get('step1')
        context?.set('step2', `after-${step1}`)
        return 'handler2'
      })

      const result = await send('context.test')
      
      expect(result.context.get('step1')).toBe('completed')
      expect(result.context.get('step2')).toBe('after-completed')
    })

    it('should handle async handlers', async () => {
      on('async.test', async (data) => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'async-result'
      })

      const result = await send('async.test')
      
      expect(result.results[0]).toBe('async-result')
    })
  })

  describe('enhanced context', () => {
    it('should create enhanced context with AI functions', () => {
      const context = createEnhancedContext({ initial: 'data' })
      
      expect(context.get('initial')).toBe('data')
      expect(typeof context.ai).toBe('function')
      expect(typeof context.list).toBe('function')
      expect(typeof context.research).toBe('function')
      expect(typeof context.extract).toBe('function')
      expect(typeof context.db).toBe('object')
    })

    it('should support onWithAI helper', async () => {
      let receivedContext: any = null

      onWithAI('ai.test', (data, context) => {
        receivedContext = context
        return 'ai-handler'
      })

      await sendWithAI('ai.test', { test: 'data' })
      
      expect(receivedContext).toBeDefined()
      expect(typeof receivedContext.ai).toBe('function')
      expect(typeof receivedContext.list).toBe('function')
    })
  })

  describe('context operations', () => {
    it('should support context set/get operations', () => {
      const context = new MutableEventContext()
      
      context.set('key1', 'value1')
      context.set('key2', { nested: 'object' })
      
      expect(context.get('key1')).toBe('value1')
      expect(context.get('key2')).toEqual({ nested: 'object' })
      expect(context.has('key1')).toBe(true)
      expect(context.has('nonexistent')).toBe(false)
    })

    it('should support context merge operations', () => {
      const context = new MutableEventContext({ initial: 'value' })
      
      context.merge({ 
        new: 'data',
        nested: { deep: 'value' }
      })
      
      expect(context.get('initial')).toBe('value')
      expect(context.get('new')).toBe('data')
      expect(context.get('nested')).toEqual({ deep: 'value' })
    })
  })

  describe('error handling', () => {
    it('should handle errors in event handlers gracefully', async () => {
      on('error.test', () => {
        throw new Error('Handler error')
      })

      on('error.test', () => {
        return 'success'
      })

      const result = await send('error.test')
      
      expect(result.results).toHaveLength(2)
      expect(result.results[0]).toBe(null) // First handler failed
      expect(result.results[1]).toBe('success') // Second handler succeeded
      expect(result.context.get('errors')).toBeDefined()
      expect(result.context.get('errors')).toHaveLength(1)
    })
  })

  describe('event management', () => {
    it('should clear specific events', async () => {
      let called = false
      
      on('clear.test', () => {
        called = true
      })

      clearEvent('clear.test')
      await send('clear.test')
      
      expect(called).toBe(false)
    })

    it('should clear all events', async () => {
      let called1 = false
      let called2 = false
      
      on('event1', () => { called1 = true })
      on('event2', () => { called2 = true })

      clearEvents()
      
      await send('event1')
      await send('event2')
      
      expect(called1).toBe(false)
      expect(called2).toBe(false)
    })
  })

  describe('emit alias', () => {
    it('should work as alias for send', async () => {
      let called = false
      
      on('emit.test', () => {
        called = true
        return 'emitted'
      })

      const result = await emit('emit.test')
      
      expect(called).toBe(true)
      expect(result.results[0]).toBe('emitted')
    })
  })
})
