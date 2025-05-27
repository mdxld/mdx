import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createExecutionContext } from './execution-context'
import { clearEvents, emit } from './event-system'
import * as inputPrompt from './input-prompt'

vi.mock('./input-prompt', () => ({
  renderInputPrompt: vi.fn(),
}))

describe('execution-context', () => {
  beforeEach(() => {
    clearEvents()
    vi.clearAllMocks()
  })

  describe('on function', () => {
    it('registers callbacks for regular events', async () => {
      const context = createExecutionContext()
      const callback = vi.fn().mockReturnValue('test result')

      await context.on('test.event', callback)
      const response = await emit('test.event', { data: 'test' })

      expect(callback).toHaveBeenCalledWith({ data: 'test' }, expect.any(Object))
      expect(response.results).toContain('test result')
    })

    it('handles async callbacks for regular events', async () => {
      const context = createExecutionContext()
      const callback = vi.fn().mockResolvedValue('async result')

      await context.on('async.event', callback)
      const response = await emit('async.event', { data: 'async' })

      expect(callback).toHaveBeenCalledWith({ data: 'async' }, expect.any(Object))
      expect(response.results).toContain('async result')
    })

    it('handles idea.captured event with input prompt', async () => {
      const mockRenderInputPrompt = vi.mocked(inputPrompt.renderInputPrompt)
      mockRenderInputPrompt.mockResolvedValue('My startup idea')

      const context = createExecutionContext()
      const callback = vi.fn().mockReturnValue('idea processed')

      const result = await context.on('idea.captured', callback)

      expect(mockRenderInputPrompt).toHaveBeenCalledWith('Enter your startup idea:')
      expect(callback).toHaveBeenCalledWith(
        'My startup idea',
        expect.objectContaining({
          eventType: 'idea.captured',
          timestamp: expect.any(String),
        }),
      )
      expect(result).toBe('idea processed')
    })

    it('registers multiple callbacks for the same event', async () => {
      const context = createExecutionContext()
      const callback1 = vi.fn().mockReturnValue('result1')
      const callback2 = vi.fn().mockReturnValue('result2')

      await context.on('multi.event', callback1)
      await context.on('multi.event', callback2)

      const response = await emit('multi.event', { data: 'multi' })

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
      expect(response.results).toContain('result1')
      expect(response.results).toContain('result2')
    })

    it('supports the workflow pattern from the example', async () => {
      const mockRenderInputPrompt = vi.mocked(inputPrompt.renderInputPrompt)
      mockRenderInputPrompt.mockResolvedValue('My startup idea')

      const context = createExecutionContext()
      const workflowCallback = vi.fn().mockImplementation(async (idea) => {
        expect(idea).toBeDefined()
        return 'workflow completed'
      })

      await context.on('idea.captured', workflowCallback)

      const result = await workflowCallback('My startup idea', {
        eventType: 'idea.captured',
        timestamp: expect.any(String),
      })

      expect(workflowCallback).toHaveBeenCalledWith('My startup idea', expect.any(Object))
      expect(result).toBe('workflow completed')
    })
  })
})
