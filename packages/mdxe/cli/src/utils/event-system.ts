/**
 * Event system for MDXE
 * Provides a simple event registry for registering and emitting events
 */

/**
 * Event handler interface
 */
interface EventHandler {
  event: string;
  callback: (data: any) => Promise<any> | any;
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
  on(event: string, callback: (data: any) => Promise<any> | any) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push({ event, callback });
    return this; // For chaining
  }

  /**
   * Emit an event with optional data
   * @param event Event name
   * @param data Optional data to pass to the event handlers
   */
  async emit(event: string, data?: any) {
    const handlers = this.handlers.get(event) || [];
    const results: any[] = [];
    
    for (const handler of handlers) {
      try {
        const result = await handler.callback(data);
        results.push(result);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }
    
    return results;
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
