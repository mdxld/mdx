/**
 * Event system for MDXE
 * Provides a simple event registry for registering and sending events
 */

/**
 * Event handler interface
 */
interface EventHandler {
  event: string;
  callback: (data: any, context?: MutableEventContext) => Promise<any> | any;
}

/**
 * Event context interface with helper methods
 * Provides a way to share and modify data between event handlers
 */
export interface EventContext {
  [key: string]: any;
  
  set?(key: string, value: any): void;
  get?(key: string): any;
  merge?(data: object): void;
  has?(key: string): boolean;
}

/**
 * Context implementation with helper methods
 */
export class MutableEventContext implements EventContext {
  [key: string]: any;
  
  constructor(initialData: object = {}) {
    Object.assign(this, initialData);
  }
  
  set(key: string, value: any): void {
    this[key] = value;
  }
  
  get(key: string): any {
    return this[key];
  }
  
  merge(data: object): void {
    this.deepMerge(this, data);
  }
  
  has(key: string): boolean {
    return key in this;
  }
  
  private deepMerge(target: any, source: any): void {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
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
  on(event: string, callback: (data: any, context?: MutableEventContext) => Promise<any> | any) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push({ event, callback });
    return this; // For chaining
  }

  /**
   * Send an event with optional data and context
   * @param event Event name
   * @param data Optional data to pass to the event handlers
   * @param context Optional context object to share between handlers
   * @returns Array of results from handlers and the final context
   */
  async send(event: string, data?: any, context: EventContext = {}) {
    const handlers = this.handlers.get(event) || [];
    const results: any[] = [];
    const mutableContext = new MutableEventContext(context);
    
    for (const handler of handlers) {
      try {
        const result = await handler.callback(data, mutableContext);
        results.push(result);
        
        if (result && typeof result === 'object' && result.context) {
          mutableContext.merge(result.context);
        }
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
        mutableContext.set('errors', mutableContext.get('errors') || []);
        mutableContext.get('errors').push({
          handler: handler.event,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return { results, context: mutableContext };
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
export const send = eventRegistry.send.bind(eventRegistry);
export const clearEvents = eventRegistry.clear.bind(eventRegistry);
export const clearEvent = eventRegistry.clearEvent.bind(eventRegistry);
