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
}

/**
 * Event context interface
 * Provides a way to share data between event handlers
 */
export interface EventContext {
  [key: string]: any;
}

/**
 * Event registry class
 * Stores event handlers and provides methods to register and emit events
 */
class EventRegistry {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register a callback for a specific event
   * @param event Event name
   * @param callback Function to call when the event is emitted
   */
  on(event: string, callback: (data: any, context?: EventContext) => Promise<any> | any) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push({ event, callback });
    return this; // For chaining
  }

  /**
   * Emit an event with optional data and context
   * @param event Event name
   * @param data Optional data to pass to the event handlers
   * @param context Optional context object to share between handlers
   * @returns Array of results from handlers and the final context
   */
  async emit(event: string, data?: any, context: EventContext = {}) {
    const handlers = this.handlers.get(event) || [];
    const results: any[] = [];
    let currentContext = { ...context }; // Clone to avoid modifying the original
    
    for (const handler of handlers) {
      try {
        const result = await handler.callback(data, currentContext);
        results.push(result);
        
        if (result && typeof result === 'object' && result.context) {
          currentContext = { ...currentContext, ...result.context };
        }
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
        currentContext.errors = currentContext.errors || [];
        currentContext.errors.push({
          handler: handler.event,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return { results, context: currentContext };
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
