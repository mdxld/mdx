import { defineConfig, s } from 'velite'

// Define a schema for posts
const mdx = {
  name: 'MDX', // collection name
  pattern: ['**/*.{md,mdx}', '!**/node_modules/**'], // glob pattern for content files
  schema: s.object({
    $: s.object({
      path: s.path(),
      code: s.mdx(),
      html: s.markdown(),
      meta: s.metadata(),
      toc: s.toc(),
      content: s.raw(),
    }),
    $id: s.string().optional(),
    $type: s.string().optional(),
    // Markdown content will be automatically processed and available as `html` and `toc`
    // The raw markdown content will be available as `raw`
    // The frontmatter will be available as `data`
    // TODO: Add more fields as needed
  })
  .passthrough() // Allow unknown properties
  .transform(props => {
    const { $, ...data } = props
    if (!data.$id) {
      // TODO: Generate a unique ID based on the content
      data.$id = $.path
    }
    return {
      id: data.$id,
      type: data.$type,
      data,
      ...$
    }
  })
}

export default defineConfig({
  root: '../..', // Explicitly set the root for Velite
  collections: { mdx },
  output: { data: './.mdx' },
})
