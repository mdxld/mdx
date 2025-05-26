/**
 * Event system for MDXE
 * Provides a simple event registry for registering and emitting events
 */

/**
 * Event handler interface
 */
interface EventHandler {
  event: string;
  callback: (data: any, context?: EventContext) => Promise<any> | any;
  timeout?: number; // Optional timeout in milliseconds
}

/**
 * Event context interface
 * Provides a way to share data between event handlers
 */
export interface EventContext {
  [key: string]: any;
}

/**
 * Event emission options
 */
export interface EmitOptions {
  timeout?: number; // Default timeout for all handlers
  parallel?: boolean; // Whether to run handlers in parallel (default: false for sequential)
}

/**
 * Event registry class
 * Stores event handlers and provides methods to register and emit events
 */
class EventRegistry {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Wrap a handler execution with timeout
   * @param handler The event handler to execute
   * @param data Data to pass to the handler
   * @param context Context to pass to the handler
   * @param timeout Timeout in milliseconds
   */
  private async executeHandlerWithTimeout(
    handler: EventHandler, 
    data: any, 
    context: EventContext, 
    timeout?: number
  ): Promise<any> {
    if (!timeout) {
      return await handler.callback(data, context);
    }
    
    return Promise.race([
      handler.callback(data, context),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Handler timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }

  /**
   * Register a callback for a specific event
   * @param event Event name
   * @param callback Function to call when the event is emitted
   * @param timeout Optional timeout in milliseconds for this handler
   */
  on(
    event: string, 
    callback: (data: any, context?: EventContext) => Promise<any> | any,
    timeout?: number
  ) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push({ event, callback, timeout });
    return this; // For chaining
  }

  /**
   * Emit an event with optional data and context
   * @param event Event name
   * @param data Optional data to pass to the event handlers
   * @param context Optional context object to share between handlers
   * @param options Optional emission options
   * @returns Array of results from handlers and the final context
   */
  async emit(event: string, data?: any, context: EventContext = {}, options: EmitOptions = {}) {
    const handlers = this.handlers.get(event) || [];
    const results: any[] = [];
    let currentContext = { ...context }; // Clone to avoid modifying the original
    
    if (options.parallel && handlers.length > 0) {
      try {
        const handlerPromises = handlers.map(async (handler, index) => {
          try {
            const handlerContext = { ...currentContext };
            const result = await this.executeHandlerWithTimeout(
              handler, 
              data, 
              handlerContext, 
              handler.timeout || options.timeout
            );
            return { success: true, result, context: handlerContext };
          } catch (error) {
            const errorInfo = this.createErrorInfo(error, event, index, data);
            
            console.error(`Error in async event handler for '${event}' (handler ${index + 1}/${handlers.length}):`, errorInfo);
            
            if (event !== 'error' && event !== 'handler.error') {
              try {
                await this.emit('handler.error', errorInfo, currentContext);
              } catch (errorHandlerError) {
                console.error('Error in error handler:', errorHandlerError);
              }
            }
            
            return { success: false, error: errorInfo };
          }
        });
        
        const handlerResults = await Promise.all(handlerPromises);
        
        handlerResults.forEach(result => {
          if (result.success) {
            results.push(result.result);
            if (result.result && typeof result.result === 'object' && result.result.context) {
              currentContext = { ...currentContext, ...result.result.context };
            }
            if (result.context) {
              currentContext = { ...currentContext, ...result.context };
            }
          } else {
            results.push(null);
            currentContext.errors = currentContext.errors || [];
            currentContext.errors.push(result.error);
          }
        });
      } catch (error) {
        console.error(`Unexpected error in parallel event emission for ${event}:`, error);
        currentContext.errors = currentContext.errors || [];
        currentContext.errors.push({
          event,
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : String(error),
          timestamp: new Date().toISOString()
        });
      }
    } else {
      for (let i = 0; i < handlers.length; i++) {
        const handler = handlers[i];
        try {
          const result = await this.executeHandlerWithTimeout(
            handler, 
            data, 
            currentContext, 
            handler.timeout || options.timeout
          );
          results.push(result);
          
          if (result && typeof result === 'object' && result.context) {
            currentContext = { ...currentContext, ...result.context };
          }
        } catch (error) {
          const errorInfo = this.createErrorInfo(error, event, i, data);
          
          console.error(`Error in async event handler for '${event}' (handler ${i + 1}/${handlers.length}):`, errorInfo);
          
          currentContext.errors = currentContext.errors || [];
          currentContext.errors.push(errorInfo);
          
          if (event !== 'error' && event !== 'handler.error') {
            try {
              await this.emit('handler.error', errorInfo, currentContext);
            } catch (errorHandlerError) {
              console.error('Error in error handler:', errorHandlerError);
            }
          }
          
          results.push(null);
        }
      }
    }
    
    return { results, context: currentContext };
  }

  /**
   * Create standardized error info object
   */
  private createErrorInfo(error: any, event: string, handlerIndex: number, data?: any) {
    return {
      event,
      handlerIndex,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : String(error),
      timestamp: new Date().toISOString(),
      data: data ? (typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)) : undefined
    };
  }

  /**
   * Clear all event handlers
   */
  clear() {
    this.handlers.clear();
  }

  /**
   * Clear event handlers for a specific event
   * @param event Event name
   */
  clearEvent(event: string) {
    this.handlers.delete(event);
  }
}

export const eventRegistry = new EventRegistry();

export const on = eventRegistry.on.bind(eventRegistry);
export const emit = eventRegistry.emit.bind(eventRegistry);
export const clearEvents = eventRegistry.clear.bind(eventRegistry);
export const clearEvent = eventRegistry.clearEvent.bind(eventRegistry);
