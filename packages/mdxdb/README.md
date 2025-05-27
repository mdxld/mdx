# `mdxdb` Packages

`mdxdb` turns a folder of Markdown or MDX files into a queryable database. The project is organized into small packages so you can choose the right backend.

## Packages

### `@mdxdb/core`

Base classes, utilities and types used by all implementations. Exported helpers include `list`, `get`, `set` and `delete`.

### `@mdxdb/fs`

File system implementation powered by [Velite](https://velite.js.org/). Provides a simple `MdxDb` class and the `mdxdb` CLI.

```ts
import { MdxDb } from '@mdxdb/fs'

const db = new MdxDb()
await db.build()
const posts = db.list('posts')
```

### `@mdxdb/sqlite`

Experimental SQLite backed database with persistent storage and vector search.

## CLI Usage

The CLI is installed with `@mdxdb/fs` and offers a few commands:

```bash
mdxdb build               # index MDX content
mdxdb generate-database   # create a database with AI
mdxdb generate-collection # scaffold a collection
mdxdb generate-documents  # add documents to a collection
```

Use `--json` for machine-readable output or `--ink` for an interactive UI.

## Quick Example

```ts
import { db } from '@mdxdb/fs'

const all = await db.list()
const readme = await db.get('readme')
```

Options:

- `-c, --collection <collection>`: Name of the collection (required)
- `-n, --count <number>`: Number of documents to generate (default: 1)
- `-d, --description <description>`: Description to guide document generation
- `--ink`: Use React Ink for interactive UI

Prerequisites:

- Requires `OPENAI_API_KEY` environment variable to be set

## Setup and Configuration

### File System Implementation (@mdxdb/fs)

The file system implementation requires a `velite.config.ts` file at the root of your project:

```typescript
import { defineConfig, s } from 'velite'

// Define a schema for a 'posts' collection
const posts = {
  name: 'Post', // Collection name
  pattern: 'content/posts/**/*.mdx', // Glob pattern for content files
  schema: s
    .object({
      title: s.string(),
      slug: s.slug('global', ['title']), // Generates slug from title
      date: s.isodate(),
      description: s.string().optional(),
      // Markdown content is automatically processed by Velite
    })
    .transform((data) => ({ ...data, permalink: `/blog/${data.slug}` })),
}

export default defineConfig({
  collections: { posts },
})
```

### SQLite Implementation (@mdxdb/sqlite)

The SQLite implementation accepts the following configuration options:

```typescript
interface SQLiteConfig {
  url?: string // SQLite database URL (default: 'file:mdxdb.db')
  authToken?: string // Auth token for cloud database
  inMemory?: boolean // Use in-memory database
  packageDir?: string // Directory containing the package
  veliteConfig?: any // Velite configuration
}
```

## Example Usage

### File System Implementation

```typescript
import { MdxDbFs } from '@mdxdb/fs'

async function main() {
  // Initialize the database
  const db = new MdxDbFs({ packageDir: process.cwd() })

  // Build the database
  await db.build()

  // List all posts
  const posts = db.list('posts')
  console.log(`Found ${posts.length} posts`)

  // Get a specific post by slug
  const post = db.get('hello-world', 'posts')

  // Create a new post
  await db.set(
    'new-post',
    {
      frontmatter: {
        title: 'New Post',
        date: new Date().toISOString().split('T')[0],
      },
      body: '# Hello World\n\nThis is a new post.',
    },
    'posts',
  )

  // Delete a post
  await db.delete('old-post', 'posts')

  // Start watching for changes
  await db.watch()

  // Later, stop watching
  db.stopWatch()
}

main().catch(console.error)
```

### SQLite Implementation

```typescript
import { MdxDbSqlite } from '@mdxdb/sqlite'

async function main() {
  // Initialize the database with SQLite configuration
  const db = new MdxDbSqlite({
    url: 'file:./content.db',
    packageDir: process.cwd(),
    veliteConfig: {
      // Your Velite configuration
    },
  })

  // Build the database
  await db.build()

  // List all posts
  const posts = db.list('posts')

  // Search for posts using vector embeddings
  const results = await db.search('react hooks tutorial', 'posts')
  console.log(`Found ${results.length} matching posts`)

  // Create a new post
  await db.set(
    'vector-search-demo',
    {
      frontmatter: {
        title: 'Vector Search Demo',
        date: new Date().toISOString().split('T')[0],
      },
      body: '# Vector Search\n\nThis post demonstrates vector search capabilities.',
    },
    'posts',
  )
}

main().catch(console.error)
```

## Package Compatibility

All mdxdb packages are ESM-only and share the same core API, making them interchangeable for most use cases. The SQLite implementation adds vector search capabilities for advanced use cases.
