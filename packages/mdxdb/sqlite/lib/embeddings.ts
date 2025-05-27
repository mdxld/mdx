import matter from 'gray-matter'

/**
 * Generate embeddings for a text string
 * This is a mock implementation for development and testing
 * In production, this would be replaced with a real embedding model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Deterministic mock implementation
    const hash = text.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0)
    }, 0)

    return Array(1536)
      .fill(0)
      .map((_, i) => {
        return Math.cos(hash * (i + 1) * 0.001) * 0.5 + 0.5
      })
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
export function chunkDocument(mdxContent: string): DocumentChunk[] {
  const chunks: DocumentChunk[] = []

  const { data: frontmatter, content: markdown } = matter(mdxContent)

  chunks.push({
    content: markdown,
    chunkType: ChunkType.Document,
  })

  chunks.push({
    content: JSON.stringify(frontmatter),
    chunkType: ChunkType.Frontmatter,
  })

  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const sections = markdown.split(headingRegex)

  let currentHeading = ''
  let currentLevel = 0
  let headingPath: string[] = []

  for (let i = 1; i < sections.length; i += 3) {
    if (i + 1 >= sections.length) break

    const level = sections[i].length
    const heading = sections[i + 1]
    const content = sections[i + 2]

    if (level <= currentLevel) {
      headingPath = headingPath.slice(0, level - 1)
    }
    headingPath[level - 1] = heading

    currentHeading = heading
    currentLevel = level

    const sectionPath = headingPath.slice(0, level).join(' > ')

    if (content.trim()) {
      chunks.push({
        content: `${currentHeading}\n${content}`,
        chunkType: ChunkType.Section,
        sectionPath,
      })
    }
  }

  return chunks
}
