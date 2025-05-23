# mdxdb

mdxdb exposes Markdown and MDX files as a queryable database

## Usage

```ts
import { db } from '@mdxdb/fs'

// get the equivalent of **/*.{md,mdx}
const mdx = await db.list()

// get the current project readme.md
const readme = await db.get('readme.md')



```