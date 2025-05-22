interface CollectionConfig {
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
 * Payload collection for MDX files
 */
export const FilesCollection: CollectionConfig = {
  slug: 'files',
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'frontmatter',
      type: 'json',
      required: true,
    },
    {
      name: 'mdx',
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
      required: true,
    },
    {
      name: 'code',
      type: 'textarea',
      required: true,
    },
    {
      name: 'collection',
      type: 'text',
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
      name: 'fileId',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
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
  ],
}
