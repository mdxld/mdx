import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runSendCommand } from './send'
import * as eventSystem from '../utils/event-system'

describe('send command', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`)
    })
  })

  it('sends an event with the provided name', async () => {
    const sendSpy = vi.spyOn(eventSystem, 'send').mockResolvedValue({
      results: [],
      context: { get: () => [] }
    })

    await runSendCommand('test-event')

    expect(sendSpy).toHaveBeenCalledWith('test-event', undefined)
  })

  it('sends an event with parsed JSON data', async () => {
    const sendSpy = vi.spyOn(eventSystem, 'send').mockResolvedValue({
      results: [],
      context: { get: () => [] }
    })

    const jsonData = '{"key": "value", "nested": {"prop": true}}'
    await runSendCommand('test-event', jsonData)

    expect(sendSpy).toHaveBeenCalledWith('test-event', {
      key: 'value',
      nested: { prop: true }
    })
  })

  it('reports the number of triggered handlers', async () => {
    vi.spyOn(eventSystem, 'send').mockResolvedValue({
      results: ['result1', 'result2'],
      context: { get: () => [] }
    })

    await runSendCommand('test-event')

    expect(console.log).toHaveBeenCalledWith('Triggered 2 handler(s)')
  })

  it('reports errors from handlers', async () => {
    const errors = [
      { error: { message: 'Handler error 1' } },
      { error: { message: 'Handler error 2' } }
    ]

    vi.spyOn(eventSystem, 'send').mockResolvedValue({
      results: ['result1', null],
      context: { get: () => errors }
    })

    await runSendCommand('test-event')

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('2 handler(s) reported errors'))
  })

  it('exits with error if event name is not provided', async () => {
    await expect(runSendCommand('')).rejects.toThrow('Process exited with code 1')
    expect(console.error).toHaveBeenCalledWith('Error: Event name is required')
  })

  it('exits with error if JSON data is invalid', async () => {
    await expect(runSendCommand('test-event', '{"invalid json')).rejects.toThrow('Process exited with code 1')
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error parsing JSON data'))
  })

  it('shows verbose output when verbose flag is set', async () => {
    const testData = { key: 'value' }
    
    vi.spyOn(eventSystem, 'send').mockResolvedValue({
      results: ['result1'],
      context: { get: () => [] }
    })

    await runSendCommand('test-event', JSON.stringify(testData), { verbose: true })

    expect(console.log).toHaveBeenCalledWith('Data:', JSON.stringify(testData, null, 2))
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Results:'))
  })
})
