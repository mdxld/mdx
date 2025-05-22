/**
 * Payload collection configuration interface
 */
export interface CollectionConfig {
  slug: string
  fields: Array<{
    name: string
    type: string
    required?: boolean
    unique?: boolean
    options?: Array<{ label: string; value: string }>
  }>
}

/**
 * Payload collection for MDX documents
 */
export const MdxCollection: CollectionConfig = {
  slug: 'mdx',
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'frontmatter',
      type: 'json',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'markdown',
      type: 'textarea',
      required: true,
    },
    {
      name: 'html',
      type: 'textarea',
      required: false,
    },
    {
      name: 'code',
      type: 'textarea',
      required: false,
    },
    {
      name: 'collection',
      type: 'text',
      required: true,
    },
    {
      name: 'createdAt',
      type: 'date',
      required: true,
    },
    {
      name: 'updatedAt',
      type: 'date',
      required: true,
    },
  ],
}

/**
 * Payload collection for vector embeddings
 */
export const EmbeddingsCollection: CollectionConfig = {
  slug: 'embeddings',
  fields: [
    {
      name: 'documentId',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'embedding',
      type: 'json',
      required: true,
    },
    {
      name: 'chunkType',
      type: 'select',
      options: [
        { label: 'Full Document', value: 'document' },
        { label: 'Frontmatter', value: 'frontmatter' },
        { label: 'Section', value: 'section' },
      ],
      required: true,
    },
    {
      name: 'sectionPath',
      type: 'text',
      required: false,
    },
    {
      name: 'collection',
      type: 'text',
      required: true,
    },
    {
      name: 'metadata',
      type: 'json',
      required: false,
    },
    {
      name: 'createdAt',
      type: 'date',
      required: true,
    },
  ],
}

/**
 * All collections exported as a single object
 */
export const collections = {
  mdx: MdxCollection,
  embeddings: EmbeddingsCollection,
}