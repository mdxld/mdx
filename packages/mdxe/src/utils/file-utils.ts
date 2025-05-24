import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Find index file in a directory
 * Looks for README.md, readme.md, index.md, index.mdx, page.md, page.mdx
 */
export async function findIndexFile(dir: string): Promise<string | null> {
  const possibleFiles = [
    path.join(dir, 'README.md'),
    path.join(dir, 'readme.md'),
    path.join(dir, 'index.md'),
    path.join(dir, 'index.mdx'),
    path.join(dir, 'page.md'),
    path.join(dir, 'page.mdx')
  ];

  for (const file of possibleFiles) {
    if (await fileExists(file)) {
      return file;
    }
  }

  return null;
}
