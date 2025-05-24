import GithubSlugger from 'github-slugger'
import fs from 'fs'
import path from 'path'

/**
 * Extracts the first H1 title from markdown content
 * @param content The markdown content
 * @returns The H1 title or null if not found
 */
export function extractH1Title(content: string): string | null {
  const h1Match = content.match(/^#\s+(.+)$/m)
  return h1Match ? h1Match[1].trim() : null
}

/**
 * Slugifies a string using github-slugger
 * @param str The string to slugify
 * @returns The slugified string
 */
export function slugifyString(str: string): string {
  const slugger = new GithubSlugger()
  return slugger.slug(str)
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath The directory path to ensure exists
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}
