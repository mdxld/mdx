import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { runSendCommand } from './send'
import * as eventSystem from '../utils/event-system'

describe('send command', () => {
  let consoleOutput: string[] = []
  let consoleErrors: string[] = []
  const originalConsoleLog = console.log
  const originalConsoleError = console.error
  const originalProcessExit = process.exit
  
  beforeEach(() => {
    consoleOutput = []
    consoleErrors = []
    
    console.log = (...args: any[]) => {
      consoleOutput.push(args.join(' '))
    }
    
    console.error = (...args: any[]) => {
      consoleErrors.push(args.join(' '))
    }
    
    process.exit = ((code?: number) => {
      throw new Error(`Process exited with code ${code}`)
    }) as any
  })
  
  afterEach(() => {
    console.log = originalConsoleLog
    console.error = originalConsoleError
    process.exit = originalProcessExit
  })

  it('sends an event with the provided name', async () => {
    const result = await runSendCommand('test-event')
    
    expect(result).toBeDefined()
  })

  it('sends an event with parsed JSON data', async () => {
    const jsonData = '{"key": "value", "nested": {"prop": true}}'
    
    const result = await runSendCommand('test-event', jsonData)
    
    expect(result).toBeDefined()
  })

  it('reports the number of triggered handlers', async () => {
    eventSystem.on('test-event', () => {
      return 'handler-result'
    })
    
    try {
      await runSendCommand('test-event')
      
      expect(consoleOutput.some(output => output.includes('Triggered 1 handler'))).toBe(true)
    } finally {
      eventSystem.clearEvent('test-event')
    }
  })

  it('reports errors from handlers', async () => {
    eventSystem.on('test-event', () => {
      throw new Error('Handler error')
    })
    
    try {
      await runSendCommand('test-event')
      
      expect(consoleOutput.some(output => output.includes('handler(s) reported errors'))).toBe(true)
    } finally {
      eventSystem.clearEvent('test-event')
    }
  })

  it('exits with error if event name is not provided', async () => {
    await expect(runSendCommand('')).rejects.toThrow('Process exited with code 1')
    expect(consoleErrors.some(error => error.includes('Error: Event name is required'))).toBe(true)
  })

  it('exits with error if JSON data is invalid', async () => {
    await expect(runSendCommand('test-event', '{"invalid json')).rejects.toThrow('Process exited with code 1')
    expect(consoleErrors.some(error => error.includes('Error parsing JSON data'))).toBe(true)
  })

  it('shows verbose output when verbose flag is set', async () => {
    const testData = { key: 'value' }
    
    eventSystem.on('test-event', () => {
      return 'handler-result'
    })
    
    try {
      await runSendCommand('test-event', JSON.stringify(testData), { verbose: true })
      
      expect(consoleOutput.some(output => output.includes('Data:'))).toBe(true)
      expect(consoleOutput.some(output => output.includes('Results:'))).toBe(true)
    } finally {
      eventSystem.clearEvent('test-event')
    }
  })
})
