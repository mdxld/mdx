import { embedDocument, EmbedConfig, EmbeddingResult } from './embed.js'
import { DocumentContent } from './types.js'

/**
 * Workflow event types
 */
export enum WorkflowEvent {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

/**
 * Workflow context for document operations
 */
export interface WorkflowContext {
  event: WorkflowEvent
  documentId: string
  collection: string
  content?: DocumentContent
}

/**
 * Workflow handler function type
 */
export type WorkflowHandler = (context: WorkflowContext) => Promise<void>

/**
 * Embedding workflow configuration
 */
export interface EmbeddingWorkflowConfig extends EmbedConfig {
  onEmbeddingGenerated?: (embeddings: EmbeddingResult[]) => Promise<void>
  onError?: (error: Error, context: WorkflowContext) => void
}

/**
 * Create an embedding workflow handler
 */
export function createEmbeddingWorkflow(
  config: EmbeddingWorkflowConfig = {}
): WorkflowHandler {
  const { onEmbeddingGenerated, onError, ...embedConfig } = config

  return async (context: WorkflowContext) => {
    // Only process create and update events
    if (context.event === WorkflowEvent.Delete) {
      return
    }

    if (!context.content) {
      console.warn(`No content provided for ${context.event} event`)
      return
    }

    try {
      // Generate embeddings for the document
      const embeddings = await embedDocument(
        context.documentId,
        context.content.body,
        context.collection,
        context.content.frontmatter,
        embedConfig
      )

      // Call the handler if provided
      if (onEmbeddingGenerated) {
        await onEmbeddingGenerated(embeddings)
      }
    } catch (error) {
      console.error(`Error generating embeddings for document ${context.documentId}:`, error)
      
      if (onError) {
        onError(error as Error, context)
      } else {
        throw error
      }
    }
  }
}

/**
 * Workflow registry for managing multiple workflows
 */
export class WorkflowRegistry {
  private workflows: Map<string, WorkflowHandler[]> = new Map()

  /**
   * Register a workflow handler
   */
  register(name: string, handler: WorkflowHandler): void {
    if (!this.workflows.has(name)) {
      this.workflows.set(name, [])
    }
    this.workflows.get(name)!.push(handler)
  }

  /**
   * Execute all workflows for a given context
   */
  async execute(context: WorkflowContext): Promise<void> {
    const handlers = this.getAllHandlers()
    
    // Execute all handlers in parallel
    await Promise.all(
      handlers.map(handler => 
        handler(context).catch(error => {
          console.error('Workflow handler error:', error)
          // Continue with other handlers even if one fails
        })
      )
    )
  }

  /**
   * Get all registered handlers
   */
  private getAllHandlers(): WorkflowHandler[] {
    const allHandlers: WorkflowHandler[] = []
    for (const handlers of this.workflows.values()) {
      allHandlers.push(...handlers)
    }
    return allHandlers
  }

  /**
   * Clear all registered workflows
   */
  clear(): void {
    this.workflows.clear()
  }
}

/**
 * Default workflow registry instance
 */
export const defaultWorkflowRegistry = new WorkflowRegistry()

/**
 * Register the embedding workflow with default configuration
 */
export function registerEmbeddingWorkflow(config?: EmbeddingWorkflowConfig): void {
  const workflow = createEmbeddingWorkflow(config)
  defaultWorkflowRegistry.register('embedding', workflow)
}