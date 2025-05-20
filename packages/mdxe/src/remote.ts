import { serialize, type SerializeOptions, type SerializeResult } from 'next-mdx-remote-client/serialize'
import type { MdxDb } from 'mdxdb'

export async function compileEntry<Frontmatter = Record<string, unknown>, Scope = Record<string, unknown>>(
  db: MdxDb,
  id: string,
  collection: string,
  options?: SerializeOptions<Frontmatter, Scope>
): Promise<SerializeResult<Frontmatter, Scope> | null> {
  const entry = db.get(id, collection)
  if (!entry || typeof entry.body !== 'string') return null
  return serialize<Frontmatter, Scope>(entry.body, options)
}

export function listFrontmatter<Frontmatter = Record<string, unknown>>(db: MdxDb, collection: string): Frontmatter[] {
  return (db.list(collection) as any[]).map((item) => item as Frontmatter)
}
