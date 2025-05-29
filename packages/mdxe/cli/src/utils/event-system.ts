/**
 * Event system for MDXE
 * Provides a simple event registry for registering and sending events
 */

/**
 * Event handler interface
 */
interface EventHandler {
  event: string
  callback: (data: any, context?: MutableEventContext) => Promise<any> | any
  timeout?: number // Optional timeout in milliseconds
}

/**
 * Event context interface with helper methods
 * Provides a way to share and modify data between event handlers
 */
export interface EventContext {
  [key: string]: any

  set?(key: string, value: any): void
  get?(key: string): any
  merge?(data: object): void
  has?(key: string): boolean
}

/**
 * Context implementation with helper methods
 */
export class MutableEventContext implements EventContext {
  [key: string]: any

  constructor(initialData: object = {}) {
    Object.assign(this, initialData)
  }

  set(key: string, value: any): void {
    this[key] = value
  }

  get(key: string): any {
    return this[key]
  }

  merge(data: object): void {
    this.deepMerge(this, data)
  }

  has(key: string): boolean {
    return key in this
  }

  private deepMerge(target: any, source: any): void {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {}
        }
        this.deepMerge(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
  }
}

/**
 * Event emission options
 */
export interface EmitOptions {
  timeout?: number // Default timeout for all handlers
  parallel?: boolean // Whether to run handlers in parallel (default: false for sequential)
}

/**
 * Event registry class
 * Stores event handlers and provides methods to register and send events
 */
class EventRegistry {
  private handlers: Map<string, EventHandler[]> = new Map()

  /**
   * Wrap a handler execution with timeout
   * @param handler The event handler to execute
   * @param data Data to pass to the handler
   * @param context Context to pass to the handler
   * @param timeout Timeout in milliseconds
   */
  private async executeHandlerWithTimeout(handler: EventHandler, data: any, context: MutableEventContext, timeout?: number): Promise<any> {
    if (!timeout) {
      return await handler.callback(data, context)
    }

    return Promise.race([
      handler.callback(data, context),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`Handler timeout after ${timeout}ms`)), timeout)),
    ])
  }

  /**
   * Register a callback for a specific event
   * @param event Event name
   * @param callback Function to call when the event is sent
   * @param timeout Optional timeout in milliseconds for this handler
   */
  on(event: string, callback: (data: any, context?: MutableEventContext) => Promise<any> | any, timeout?: number) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event)!.push({ event, callback, timeout })
    return this // For chaining
  }

  /**
   * Send an event with optional data and context
   * @param event Event name
   * @param data Optional data to pass to the event handlers
   * @param context Optional context object to share between handlers
   * @param options Optional emission options
   * @returns Array of results from handlers and the final context
   */
  async send(event: string, data?: any, context: EventContext = {}, options: EmitOptions = {}) {
    const handlers = this.handlers.get(event) || []
    const results: any[] = []
    const mutableContext = context instanceof MutableEventContext 
      ? context 
      : new MutableEventContext(context)

    if (options.parallel && handlers.length > 0) {
      try {
        const handlerPromises = handlers.map(async (handler, index) => {
          try {
            const result = await this.executeHandlerWithTimeout(handler, data, mutableContext, handler.timeout || options.timeout)
            return { success: true, result, index }
          } catch (error) {
            const errorInfo = this.createErrorInfo(error, event, index, data)

            console.error(`Error in async event handler for '${event}' (handler ${index + 1}/${handlers.length}):`, errorInfo)

            if (event !== 'error' && event !== 'handler.error') {
              try {
                await this.send('handler.error', errorInfo, mutableContext)
              } catch (errorHandlerError) {
                console.error('Error in error handler:', errorHandlerError)
              }
            }

            return { success: false, error: errorInfo, index }
          }
        })

        const handlerResults = await Promise.all(handlerPromises)

        handlerResults.forEach((result) => {
          if (result.success) {
            results.push(result.result)
            if (result.result && typeof result.result === 'object' && result.result.context) {
              mutableContext.merge(result.result.context)
            }
          } else {
            results.push(null)
            const errors = mutableContext.get('errors') || []
            errors.push(result.error)
            mutableContext.set('errors', errors)
          }
        })
      } catch (error) {
        console.error(`Unexpected error in parallel event emission for ${event}:`, error)
        const errors = mutableContext.get('errors') || []
        errors.push(this.createErrorInfo(error, event, -1, data))
        mutableContext.set('errors', errors)
      }
    } else {
      for (let i = 0; i < handlers.length; i++) {
        const handler = handlers[i]
        try {
          const result = await this.executeHandlerWithTimeout(handler, data, mutableContext, handler.timeout || options.timeout)
          results.push(result)

          if (result && typeof result === 'object' && result.context) {
            mutableContext.merge(result.context)
          }
        } catch (error) {
          const errorInfo = this.createErrorInfo(error, event, i, data)
          
          console.error(`Error in async event handler for '${event}' (handler ${i + 1}/${handlers.length}): ${error instanceof Error ? error.message : String(error)}`)

          const errors = mutableContext.get('errors') || []
          errors.push(errorInfo)
          mutableContext.set('errors', errors)

          if (event !== 'error' && event !== 'handler.error') {
            try {
              await this.send('handler.error', errorInfo, mutableContext)
            } catch (errorHandlerError) {
              console.error('Error in error handler:', errorHandlerError)
            }
          }

          results.push(null)
        }
      }
    }

    return { results, context: mutableContext }
  }

  /**
   * Create standardized error info object
   */
  private createErrorInfo(error: any, event: string, handlerIndex: number, data?: any) {
    return {
      event,
      handlerIndex,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : String(error),
      timestamp: new Date().toISOString(),
      data: data ? (typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)) : undefined,
    }
  }

  /**
   * Clear all event handlers
   */
  clear() {
    this.handlers.clear()
  }

  /**
   * Clear event handlers for a specific event
   * @param event Event name
   */
  clearEvent(event: string) {
    this.handlers.delete(event)
  }
}

export const eventRegistry = new EventRegistry()

export const on = eventRegistry.on.bind(eventRegistry)
export const send = eventRegistry.send.bind(eventRegistry)
export const emit = eventRegistry.send.bind(eventRegistry) // Alias for backward compatibility
export const clearEvents = eventRegistry.clear.bind(eventRegistry)
export const clearEvent = eventRegistry.clearEvent.bind(eventRegistry)
