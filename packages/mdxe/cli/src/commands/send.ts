/**
 * MDXE Send Command
 * Sends events from the command line to trigger registered handlers
 */

import { send } from '../utils/event-system'

export interface SendOptions {
  verbose?: boolean
}

/**
 * Run the send command
 * @param eventName Name of the event to send
 * @param eventData Optional JSON data to send with the event
 * @param options Command options
 */
export async function runSendCommand(eventName: string, eventData?: string, options: SendOptions = {}) {
  if (!eventName) {
    console.error('Error: Event name is required')
    console.log('Usage: mdxe send [event] [data]')
    process.exit(1)
  }

  let parsedData: any = undefined

  if (eventData) {
    try {
      parsedData = JSON.parse(eventData)
    } catch (error) {
      console.error(`Error parsing JSON data: ${error instanceof Error ? error.message : String(error)}`)
      console.log('Data must be valid JSON. Example: mdxe send my-event \'{"key": "value"}\'')
      process.exit(1)
    }
  }

  try {
    console.log(`Sending event: ${eventName}${parsedData ? ' with data' : ''}`)
    if (options.verbose && parsedData) {
      console.log('Data:', JSON.stringify(parsedData, null, 2))
    }

    const result = await send(eventName, parsedData)
    
    console.log(`✅ Event sent successfully`)
    console.log(`Triggered ${result.results.length} handler(s)`)
    
    if (options.verbose) {
      console.log('Results:', result.results)
    }
    
    const errors = result.context.get?.('errors') || []
    if (errors.length > 0) {
      console.log(`\n⚠️ ${errors.length} handler(s) reported errors:`)
      errors.forEach((error: any, index: number) => {
        console.log(`  Handler ${index + 1}: ${error.error?.message || JSON.stringify(error)}`)
      })
    }
    
    return result
  } catch (error) {
    console.error(`Error sending event: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}
