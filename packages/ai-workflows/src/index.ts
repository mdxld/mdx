/**
 * AI Workflows Package
 * Provides event system and AI template functions for workflow automation
 */

export {
  EventContext,
  EnhancedEventContext,
  MutableEventContext,
  EmitOptions,
  on,
  send,
  emit,
  clearEvents,
  clearEvent
} from './event-system'

export {
  AIRequest,
  setRequestUpdateCallback,
  getAIRequests,
  clearAIRequests,
  aiTemplateFunction,
  listTemplateFunction,
  researchTemplateFunction,
  extractTemplateFunction,
  dbProxy
} from './ai-template-functions'

export {
  renderInputPrompt
} from './input-prompt'

import { MutableEventContext, EnhancedEventContext, on, send } from './event-system'
import { 
  aiTemplateFunction, 
  listTemplateFunction, 
  researchTemplateFunction, 
  extractTemplateFunction, 
  dbProxy 
} from './ai-template-functions'

/**
 * Create an enhanced context with AI functions
 * This is a helper function to create contexts that include all AI functions
 */
export function createEnhancedContext(initialData: object = {}) {
  const context = new MutableEventContext(initialData)
  
  Object.assign(context, {
    ai: aiTemplateFunction,
    list: listTemplateFunction,
    research: researchTemplateFunction,
    extract: extractTemplateFunction,
    db: dbProxy
  })
  
  return context
}

/**
 * Enhanced event registration that automatically provides AI functions in context
 * @param event Event name
 * @param callback Function to call when the event is sent
 * @param timeout Optional timeout in milliseconds for this handler
 */
export function onWithAI(
  event: string, 
  callback: (data: any, context?: EnhancedEventContext) => Promise<any> | any, 
  timeout?: number
) {
  return on(event, callback, timeout)
}

/**
 * Enhanced event sending that automatically provides AI functions in context
 * @param event Event name
 * @param data Optional data to pass to the event handlers
 * @param context Optional context object to share between handlers
 * @param options Optional emission options
 */
export async function sendWithAI(
  event: string, 
  data?: any, 
  context: object = {}, 
  options: any = {}
) {
  const enhancedContext = createEnhancedContext(context)
  return await send(event, data, enhancedContext, options)
}

export const ai = aiTemplateFunction
export const list = listTemplateFunction
export const research = researchTemplateFunction
export const extract = extractTemplateFunction
export const db = dbProxy
