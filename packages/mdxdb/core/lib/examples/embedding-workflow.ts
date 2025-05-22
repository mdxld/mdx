import { registerEmbeddingWorkflow, EmbeddingResult } from '../index.js'

/**
 * Example of how to use the embedding workflow
 */

// Register the embedding workflow with custom configuration
registerEmbeddingWorkflow({
  // Use text-embedding-3-large model with 256 dimensions as requested
  model: 'text-embedding-3-large',
  dimensions: 256,
  
  // Handler called when embeddings are generated
  onEmbeddingGenerated: async (embeddings: EmbeddingResult[]) => {
    console.log(`Generated ${embeddings.length} embeddings for document`)
    
    // Here you would typically store the embeddings in your database
    // For example, if using the sqlite implementation:
    // await db.storeEmbeddings(embeddings)
    
    for (const embedding of embeddings) {
      console.log({
        documentId: embedding.documentId,
        chunkType: embedding.chunkType,
        sectionPath: embedding.sectionPath,
        embeddingDimensions: embedding.embedding.length,
      })
    }
  },
  
  // Error handler
  onError: (error, context) => {
    console.error(`Failed to generate embeddings for ${context.documentId}:`, error)
    // You might want to log this to a monitoring service
  },
})

// Example of how implementations would use this:
/*
// In your MdxDb implementation:
class MyMdxDb extends MdxDbBase {
  async setImplementation(id: string, content: DocumentContent, collectionName: string): Promise<void> {
    // Store the document in your database
    await this.storeDocument(id, content, collectionName)
    
    // The workflow will automatically generate embeddings
    // due to the base class calling workflows before setImplementation
  }
}

// Usage:
const db = new MyMdxDb()
await db.set('my-document', {
  frontmatter: { title: 'My Document', date: '2024-01-01' },
  body: '# My Document\n\nThis is the content...'
}, 'posts')
*/