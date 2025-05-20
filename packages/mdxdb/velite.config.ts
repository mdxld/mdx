import { defineConfig, s } from 'velite'

// Define a schema for posts
const posts = {
  name: 'Post', // collection name
  pattern: 'content/posts/**/*.mdx', // glob pattern for content files
  schema: s.object({
    title: s.string(), // Zod schema for title
    slug: s.string(), // Expect slug as a simple string from frontmatter for now
    date: s.isodate(), // Zod schema for date
    description: s.string().optional(), // Zod schema for optional description
    tags: s.array(s.string()).optional(), // Zod schema for optional array of strings
    // Markdown content will be automatically processed and available as `html` and `toc`
    // The raw markdown content will be available as `raw`
    // The frontmatter will be available as `data`
    // TODO: Add more fields as needed
  }).transform(data => ({ ...data, permalink: `/blog/${data.slug}` }))
}

export default defineConfig({
  root: '.', // Explicitly set the root for Velite
  collections: { posts }
})
