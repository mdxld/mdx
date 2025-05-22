# `mdxdb` - Markdown/MDX Files as a Database

`mdxdb` provides a lightweight persistence layer for the `mdx*` tools. It treats a collection of Markdown or MDX documents as structured data so they can be queried and updated programmatically. Under the hood it uses Velite for content discovery and can watch the file system for changes, keeping an in-memory database in sync with your files.

## Features

- List, get and set operations for content entries.
- Works with frontmatter metadata to filter and query documents.
- Designed to play nicely with Git for version control of data.
- Forms the storage backend for tools like `mdxai` and `mdxe`.

## Example

```ts
import { ai } from 'mdxai'
import { db } from 'mdxdb'

const count = 100
const topic = 'the future of work post-AGI'
const titles = await ai.list`${count} blog post titles about ${topic}`

for (const title of titles) {
  const post = await ai`Write a blog post about ${title}`
  await db.set(`blog/${title.replace(' ', '_')}`, post)
}
```

`mdxdb` is a Node.js library designed to treat a collection of local Markdown (MDX) files as a queryable database. It leverages [Velite](https://velite.js.org/) for parsing and schema definition, providing a simple API for CRUD (Create, Read, Update, Delete) operations on your content.

## Phase 1 Functionality

Phase 1 of `mdxdb` establishes the core functionality, focusing on:

- Integration with Velite for file processing and schema validation.
- In-memory database populated from your MDX/Markdown files.
- Basic CRUD operations: listing, getting, setting (creating/updating), and deleting content entries.
- Real-time updates through Velite's watch mode.

## Setup & Configuration

### Installation

`mdxdb` is currently used as a local package within this monorepo. It relies on `velite` for its core processing. Ensure `velite` and `gray-matter` (for `set` operations) are installed in your project:

```bash
npm install velite gray-matter
# or
yarn add velite gray-matter
# or
pnpm add velite gray-matter
```

### Velite Configuration (`velite.config.ts`)

`mdxdb` requires a `velite.config.ts` (or `.js`) file at the root of your `mdxdb` package or project. This file tells Velite where to find your content files and how to process their frontmatter.

**Example `velite.config.ts`:**

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

Place your content files (e.g., `.mdx` files) in the directory specified by the `pattern` (e.g., `packages/mdxdb/content/posts/`).

### Instantiating `MdxDb`

To use `mdxdb`, import and instantiate the `MdxDb` class. It automatically loads the `velite.config.ts` from its expected location (typically the root of the `mdxdb` package).

```typescript
import { MdxDb } from './lib/mdxdb' // Adjust path as necessary

const db = new MdxDb()
```

## API Usage

All asynchronous methods return Promises.

### `db.build(): Promise<VeliteData>`

Rebuilds the database from your content files using Velite. This method is called internally by `mdxdb` when needed but can be called manually if you need to force a rebuild and get the full dataset. It populates the in-memory database.

```typescript
async function initializeDb() {
  const allData = await db.build()
  console.log('Database built. Available collections:', Object.keys(allData))
}
```

### `db.watch(): Promise<void>`

Starts Velite's watch mode. This monitors your content files for changes (additions, updates, deletions) and automatically updates the in-memory database. Velite's output will typically appear in the console.

```typescript
await db.watch()
console.log('MdxDb is watching for file changes...')
```

### `db.stopWatch(): void`

Stops the active Velite watch mode process.

```typescript
db.stopWatch()
console.log('MdxDb watch mode stopped.')
```

### `db.list(collectionName?: string): any[]`

Retrieves entries from the in-memory database.

- If `collectionName` (string) is provided, it returns all entries from that specific collection.
- If `collectionName` is omitted, it returns all entries from all collections combined.
  Returns an empty array if the collection doesn't exist or if no data is loaded.

```typescript
const allPosts = db.list('posts')
console.log(`Found ${allPosts.length} posts.`)

const allContent = db.list() // Get everything from all collections
console.log(`Found ${allContent.length} total entries.`)
```

### `db.get(id: string, collectionName?: string): any | undefined`

Retrieves a single entry by its ID (which is assumed to be the `slug` field of an entry).

- `id` (string): The slug of the entry to retrieve.
- `collectionName` (string, optional): If provided, searches only within this collection. If omitted, searches all collections.
  Returns the entry object if found, otherwise `undefined`.

```typescript
const myPost = db.get('my-awesome-post-slug', 'posts')
if (myPost) {
  console.log('Found post:', myPost.title)
}
```

### `db.set(id: string, contentObject: { frontmatter: object, body: string }, collectionName: string): Promise<boolean>`

Creates a new MDX file or overwrites an existing one.

- `id` (string): The slug for the entry. This will be used as the filename (e.g., `id.mdx`).
- `contentObject` (object): An object with two keys:
  - `frontmatter` (object): Key-value pairs for the YAML frontmatter.
  - `body` (string): The Markdown/MDX content for the body of the file.
- `collectionName` (string): The name of the collection where this entry belongs. This determines the directory where the file is written, based on the collection's `pattern` in `velite.config.ts`.
  Returns `Promise<boolean>` resolving to `true` on success. Throws an error on failure.

```typescript
try {
  await db.set(
    'new-post-slug',
    {
      frontmatter: { title: 'My New Post', date: '2024-08-01', draft: true },
      body: '# Hello World\n\nThis is a new post.',
    },
    'posts',
  )
  console.log('Post created/updated successfully.')
  // If not in watch mode, or to ensure immediate data availability:
  // await db.build();
} catch (error) {
  console.error('Failed to set post:', error)
}
```

### `db.delete(id: string, collectionName: string): Promise<boolean>`

Deletes an MDX file.

- `id` (string): The slug of the entry (filename without extension).
- `collectionName` (string): The collection from which to delete the entry.
  Returns `Promise<boolean>`: `true` if the file was deleted, `false` if the file didn't exist. Throws an error for other failures.

```typescript
try {
  const deleted = await db.delete('old-post-slug', 'posts')
  if (deleted) {
    console.log('Post deleted successfully.')
    // If not in watch mode, or to ensure immediate data availability:
    // await db.build();
  } else {
    console.log('Post not found, nothing to delete.')
  }
} catch (error) {
  console.error('Failed to delete post:', error)
}
```

## Data Structure

Entries retrieved via `list()` or `get()` are JavaScript objects. Their structure is determined by your Velite schema for each collection. Typically, this includes all fields defined in your schema (sourced from frontmatter) and any fields added by Velite itself (e.g., `slug`, `path`, `permalink`, content rendered as `html`, `toc`, etc., depending on your Velite configuration).

## Example Usage Snippet

```typescript
import { MdxDb } from './lib/mdxdb' // Adjust path

async function main() {
  const db = new MdxDb()

  console.log('Building database...')
  await db.build()
  console.log('Database built.')

  // List all posts
  const posts = db.list('posts')
  console.log(`Found ${posts.length} posts:`)
  posts.forEach((post) => console.log(`- ${post.title} (slug: ${post.slug})`))

  // Get a specific post
  if (posts.length > 0) {
    const firstPostSlug = posts[0].slug
    const specificPost = db.get(firstPostSlug, 'posts')
    if (specificPost) {
      console.log(`\nRetrieved post by slug '${firstPostSlug}':`, specificPost.title)
    }
  }

  // Example of creating a new post (then you might want to rebuild or rely on watch mode)
  try {
    await db.set(
      'example-new-post',
      {
        frontmatter: { title: 'An Example New Post', date: new Date().toISOString().split('T')[0] },
        body: '## Introduction\n\nThis is an example.',
      },
      'posts',
    )
    console.log("\nNew post 'example-new-post' created.")
    // In a real app, allow watch mode to pick this up, or call await db.build();
  } catch (e) {
    console.error('\nError creating new post:', e)
  }

  // To run watch mode (typically in a long-running process):
  // console.log('\nStarting watch mode (press Ctrl+C to stop)...');
  // await db.watch();
  // db.stopWatch(); // Call this on graceful shutdown
}

main().catch(console.error)
```
