import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'

/**
 * Configuration for embedding generation
 */
export interface EmbedConfig {
  model?: string
  dimensions?: number
}

/**
 * Default embedding configuration
 */
const DEFAULT_CONFIG: Required<EmbedConfig> = {
  model: 'text-embedding-3-large',
  dimensions: 256,
}

/**
 * Generate embeddings for a text string using OpenAI
 */
export async function generateEmbedding(
  text: string,
  config: EmbedConfig = {}
): Promise<number[]> {
  const { model, dimensions } = { ...DEFAULT_CONFIG, ...config }

  try {
    const { embedding } = await embed({
      model: openai.embedding(model, { dimensions }),
      value: text,
    })

    return embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error(`Failed to generate embedding: ${(error as Error).message}`)
  }
}

/**
 * Chunk types for document embedding
 */
export enum ChunkType {
  Document = 'document',
  Frontmatter = 'frontmatter',
  Section = 'section',
}

/**
 * Document chunk with content and metadata
 */
export interface DocumentChunk {
  content: string
  chunkType: ChunkType
  sectionPath?: string
}

/**
 * Split a document into chunks for embedding
 */
export function chunkDocument(content: string, frontmatter?: any): DocumentChunk[] {
  const chunks: DocumentChunk[] = []

  // Add full document chunk
  chunks.push({
    content: content,
    chunkType: ChunkType.Document,
  })

  // Add frontmatter chunk if available
  if (frontmatter && Object.keys(frontmatter).length > 0) {
    chunks.push({
      content: JSON.stringify(frontmatter),
      chunkType: ChunkType.Frontmatter,
    })
  }

  // Split content into sections based on headings
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const sections = content.split(headingRegex)

  let headingPath: string[] = []

  for (let i = 1; i < sections.length; i += 3) {
    if (i + 1 >= sections.length) break

    const level = sections[i].length
    const heading = sections[i + 1]
    const sectionContent = sections[i + 2]

    // Update heading path based on level
    if (level <= headingPath.length) {
      headingPath = headingPath.slice(0, level - 1)
    }
    headingPath[level - 1] = heading

    const sectionPath = headingPath.slice(0, level).join(' > ')

    if (sectionContent.trim()) {
      chunks.push({
        content: `${heading}\n${sectionContent}`,
        chunkType: ChunkType.Section,
        sectionPath,
      })
    }
  }

  return chunks
}

/**
 * Embedding result with metadata
 */
export interface EmbeddingResult {
  documentId: string
  content: string
  embedding: number[]
  chunkType: ChunkType
  sectionPath?: string
  collection: string
  metadata?: any
}

/**
 * Generate embeddings for a document and its chunks
 */
export async function embedDocument(
  documentId: string,
  content: string,
  collection: string,
  frontmatter?: any,
  config?: EmbedConfig
): Promise<EmbeddingResult[]> {
  const chunks = chunkDocument(content, frontmatter)
  const results: EmbeddingResult[] = []

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content, config)
    
    results.push({
      documentId,
      content: chunk.content,
      embedding,
      chunkType: chunk.chunkType,
      sectionPath: chunk.sectionPath,
      collection,
      metadata: {
        dimensions: config?.dimensions || DEFAULT_CONFIG.dimensions,
        model: config?.model || DEFAULT_CONFIG.model,
      },
    })
  }

  return results
}