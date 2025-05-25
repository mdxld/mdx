# MDX Database (mdxdb)

MDX Database provides a way to treat Markdown and MDX files as a queryable database. It offers a unified API for storing, retrieving, and searching content across different storage backends.

## Package Overview

The mdxdb ecosystem consists of three main packages:

### @mdxdb/core

Core interfaces and base classes that define the shared API across all implementations.

**Key Features:**
- Abstract base classes and interfaces
- Common utility functions
- Shared type definitions
- Schema discovery functionality

### @mdxdb/fs

File system implementation with CLI tools for content management.

**Key Features:**
- Velite integration for content discovery and parsing
- File watching for real-time updates
- CLI tools for content generation
- Git integration for version control

### @mdxdb/sqlite

SQLite-based implementation with vector search capabilities.

**Key Features:**
- SQLite backend for persistent storage
- Vector embeddings for semantic search
- Document chunking for improved search relevance
- Compatible with the same core API as the file system implementation

## Core API Reference

All mdxdb implementations share the same core API defined by the `MdxDbInterface`:

### build()

Builds or rebuilds the database from content files.

```typescript
build(): Promise<VeliteData>
```

Returns a Promise that resolves to the database data (collections of documents).

### watch()

Starts watching for changes to content files.

```typescript
watch(): Promise<void>
```

Returns a Promise that resolves when the watch process has started.

### stopWatch()

Stops watching for changes.

```typescript
stopWatch(): void
```

### list()

Lists documents from a collection or all collections.

```typescript
list(collectionName?: string, pattern?: string): any[]
```

- `collectionName` (optional): Collection name to filter results
- `pattern` (optional): Glob pattern to filter results

Returns an array of document objects.

### get()

Gets a document by ID.

```typescript
get(id: string, collectionName?: string, pattern?: string): any | undefined
```

- `id`: Document ID to retrieve
- `collectionName` (optional): Collection name to search in
- `pattern` (optional): Glob pattern to match against document paths

Returns the document object if found, otherwise `undefined`.

### set()

Creates or updates a document.

```typescript
set(id: string, content: DocumentContent, collectionName: string, pattern?: string): Promise<void>
```

- `id`: Document ID to create or update
- `content`: Document content to write (frontmatter and body)
- `collectionName`: Collection name to create or update in
- `pattern` (optional): Glob pattern to match files to update

The `DocumentContent` interface includes:

```typescript
interface DocumentContent {
  frontmatter: Record<string, any>
  body: string
}
```

### delete()

Deletes a document.

```typescript
delete(id: string, collectionName: string, pattern?: string): Promise<boolean>
```

- `id`: Document ID to delete
- `collectionName`: Collection name to delete from
- `pattern` (optional): Glob pattern to match files to delete

Returns a Promise that resolves to `true` if the document was deleted, `false` if it wasn't found.

### search() (optional)

Searches for documents using vector embeddings (implemented in @mdxdb/sqlite).

```typescript
search?(query: string, collectionName?: string): Promise<any[]>
```

- `query`: Search query text
- `collectionName` (optional): Collection name to search in

Returns a Promise that resolves to an array of matching documents.

## CLI Usage (@mdxdb/fs)

The @mdxdb/fs package includes a CLI for managing content.

### Global Options

- `--json`: Emit JSON describing actions/results
- `--concurrency <number>`: Maximum number of concurrent operations for batch commands (default: 20)

### Commands

#### mdxdb build

Builds the MDX database.

```bash
mdxdb build
```

This command:
1. Instantiates MdxDbFs with the current working directory
2. Builds the database using Velite
3. Exports the database to the `.db` directory

#### mdxdb generate-database

Generates a database with multiple collections.

```bash
mdxdb generate-database [options]
```

Options:
- `-d, --description <description>`: Description of the database to generate
- `-c, --count <number>`: Number of collections to generate (default: 3)
- `--ink`: Use React Ink for interactive UI

Prerequisites:
- Requires `OPENAI_API_KEY` environment variable to be set

#### mdxdb generate-collection

Generates a collection with a schema.

```bash
mdxdb generate-collection [options]
```

Options:
- `-d, --description <description>`: Description of the collection to generate
- `-n, --name <name>`: Name of the collection
- `--ink`: Use React Ink for interactive UI

Prerequisites:
- Requires `OPENAI_API_KEY` environment variable to be set

#### mdxdb generate-documents

Generates documents for a collection.

```bash
mdxdb generate-documents [options]
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
        date: new Date().toISOString().split('T')[0] 
      },
      body: '# Hello World\n\nThis is a new post.'
    },
    'posts'
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
    }
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
        date: new Date().toISOString().split('T')[0] 
      },
      body: '# Vector Search\n\nThis post demonstrates vector search capabilities.'
    },
    'posts'
  )
}

main().catch(console.error)
```

## Package Compatibility

All mdxdb packages are ESM-only and share the same core API, making them interchangeable for most use cases. The SQLite implementation adds vector search capabilities for advanced use cases.
