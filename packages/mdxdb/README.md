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
