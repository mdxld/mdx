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
