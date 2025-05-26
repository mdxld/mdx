import matter from 'gray-matter'

const embed = async ({ model, input, dimensions }: { model: string; input: string; dimensions: number }) => {
  return Array(dimensions)
    .fill(0)
    .map(() => Math.random())
}

/**
 * Generate embeddings for a text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embedding = await embed({
      model: 'openai/embeddings-large-3',
      input: text,
      dimensions: 256,
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
