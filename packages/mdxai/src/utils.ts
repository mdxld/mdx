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
 * Extracts the first several words from content for use as a title
 * Used as fallback when no H1 header is found in generated content
 * @param content The content to extract words from
 * @param wordCount Maximum number of words to extract (default: 6)
 * @returns The first words or null if content is empty
 */
export function extractFirstWords(content: string, wordCount: number = 6): string | null {
  const cleanContent = content.replace(/^#+\s+/gm, '').trim()
  const words = cleanContent.split(/\s+/).filter(word => word.length > 0)
  return words.length > 0 ? words.slice(0, wordCount).join(' ') : null
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

/**
 * Default .ai folder structure
 */
export const AI_FOLDER_STRUCTURE = {
  ROOT: '.ai',
  FUNCTIONS: 'functions',
  TEMPLATES: 'templates',
  VERSIONS: 'versions',
  CACHE: 'cache',
} as const

/**
 * Creates the .ai folder structure if it doesn't exist
 * @param workingDir The directory to create the .ai structure in
 */
export function createAiFolderStructure(workingDir = process.cwd()): void {
  const aiDir = path.join(workingDir, AI_FOLDER_STRUCTURE.ROOT)
  const functionsDir = path.join(aiDir, AI_FOLDER_STRUCTURE.FUNCTIONS)
  const templatesDir = path.join(aiDir, AI_FOLDER_STRUCTURE.TEMPLATES)
  const versionsDir = path.join(aiDir, AI_FOLDER_STRUCTURE.VERSIONS)
  const cacheDir = path.join(aiDir, AI_FOLDER_STRUCTURE.CACHE)

  ensureDirectoryExists(aiDir)
  ensureDirectoryExists(functionsDir)
  ensureDirectoryExists(templatesDir)
  ensureDirectoryExists(versionsDir)
  ensureDirectoryExists(cacheDir)

  const configPath = path.join(aiDir, 'config.json')
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      version: '1.0.0',
      defaultFormat: 'mdx',
      autoCreate: true,
      versioning: true,
    }
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
  }
}

/**
 * Writes an AI function definition to the .ai folder
 * @param functionName The name of the AI function
 * @param content The content of the function (frontmatter + template)
 * @param workingDir The directory containing the .ai folder
 * @param options Additional options for writing
 * @returns The path to the written file
 */
export function writeAiFunction(
  functionName: string,
  content: string,
  workingDir = process.cwd(),
  options: { format?: 'md' | 'mdx'; subfolder?: string; version?: string } = {},
): string {
  const { format = 'mdx', subfolder, version } = options

  createAiFolderStructure(workingDir)

  let targetDir = path.join(workingDir, AI_FOLDER_STRUCTURE.ROOT, AI_FOLDER_STRUCTURE.FUNCTIONS)
  if (subfolder) {
    targetDir = path.join(targetDir, subfolder)
    ensureDirectoryExists(targetDir)
  }

  const fileName = `${functionName}.${format}`
  const filePath = path.join(targetDir, fileName)

  if (version) {
    const versionsDir = path.join(workingDir, AI_FOLDER_STRUCTURE.ROOT, AI_FOLDER_STRUCTURE.VERSIONS, functionName)
    ensureDirectoryExists(versionsDir)
    const versionFilePath = path.join(versionsDir, `${version}.${format}`)
    fs.writeFileSync(versionFilePath, content, 'utf-8')
  }

  fs.writeFileSync(filePath, content, 'utf-8')
  return filePath
}

/**
 * Finds and reads an AI function file from the .ai directory
 * @param functionName The name of the AI function
 * @param workingDir The directory to start searching from (defaults to process.cwd())
 * @returns The file content and path, or null if not found
 */
export async function findAiFunction(functionName: string, workingDir = process.cwd()): Promise<{ content: string; filePath: string } | null> {
  const possibleExtensions = ['md', 'mdx']
  const aiDir = path.join(workingDir, AI_FOLDER_STRUCTURE.ROOT)

  if (!fs.existsSync(aiDir)) {
    return null
  }

  for (const ext of possibleExtensions) {
    const filePath = path.join(aiDir, `${functionName}.${ext}`)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      return { content, filePath }
    }
  }

  return null
}

/**
 * Finds AI function definitions recursively in the .ai folder hierarchy
 * @param workingDir The directory to search from
 * @returns Array of all found AI function definitions
 */
export function findAiFunctionsInHierarchy(workingDir = process.cwd()): Array<{
  name: string
  path: string
  content: string
  subfolder?: string
}> {
  const aiDir = path.join(workingDir, AI_FOLDER_STRUCTURE.ROOT)
  const functionsDir = path.join(aiDir, AI_FOLDER_STRUCTURE.FUNCTIONS)

  if (!fs.existsSync(functionsDir)) {
    return []
  }

  const results: Array<{ name: string; path: string; content: string; subfolder?: string }> = []

  function scanDirectory(dir: string, subfolder?: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        const newSubfolder = subfolder ? path.join(subfolder, entry.name) : entry.name
        scanDirectory(fullPath, newSubfolder)
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
        const name = path.basename(entry.name, path.extname(entry.name))
        const content = fs.readFileSync(fullPath, 'utf-8')
        results.push({ name, path: fullPath, content, subfolder })
      }
    }
  }

  scanDirectory(functionsDir)
  return results
}

/**
 * Enhanced version of findAiFunction with hierarchy support
 * @param functionName The name of the AI function
 * @param workingDir The directory to start searching from
 * @returns The file content and path, or null if not found
 */
export async function findAiFunctionEnhanced(
  functionName: string,
  workingDir = process.cwd(),
): Promise<{ content: string; filePath: string; subfolder?: string } | null> {
  const simpleResult = await findAiFunction(functionName, workingDir)
  if (simpleResult) {
    return simpleResult
  }

  const allFunctions = findAiFunctionsInHierarchy(workingDir)
  const match = allFunctions.find((func) => func.name === functionName)

  if (match) {
    return {
      content: match.content,
      filePath: match.path,
      subfolder: match.subfolder,
    }
  }

  return null
}

/**
 * Creates a template AI function file if it doesn't exist
 * @param functionName The name of the AI function
 * @param workingDir The directory containing the .ai folder
 * @returns The path to the created or existing file
 */
export function ensureAiFunctionExists(functionName: string, workingDir = process.cwd()): string {
  createAiFolderStructure(workingDir)

  const aiDir = path.join(workingDir, AI_FOLDER_STRUCTURE.ROOT)
  const configPath = path.join(aiDir, 'config.json')

  let config = { autoCreate: true, defaultFormat: 'mdx' }
  if (fs.existsSync(configPath)) {
    config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf-8')) }
  }

  if (!config.autoCreate) {
    throw new Error(`AI function '${functionName}' not found and auto-creation is disabled`)
  }

  const existing = findAiFunctionsInHierarchy(workingDir).find((f) => f.name === functionName)
  if (existing) {
    return existing.path
  }

  const templateContent = `---
output: string
model: gpt-4o
temperature: 0.7
description: AI function for ${functionName}
created: ${new Date().toISOString()}
---

You are a helpful AI assistant. Process the following request: \${prompt}

Please provide a thoughtful and accurate response.`

  return writeAiFunction(functionName, templateContent, workingDir, { format: config.defaultFormat as 'md' | 'mdx' })
}

/**
 * Creates a new version of an AI function
 * @param functionName The name of the AI function
 * @param content The new content
 * @param version The version identifier
 * @param workingDir The directory containing the .ai folder
 * @returns The path to the created version file
 */
export function createAiFunctionVersion(functionName: string, content: string, version: string, workingDir = process.cwd()): string {
  return writeAiFunction(functionName, content, workingDir, { version })
}

/**
 * Lists all versions of an AI function
 * @param functionName The name of the AI function
 * @param workingDir The directory containing the .ai folder
 * @returns Array of version information
 */
export function listAiFunctionVersions(functionName: string, workingDir = process.cwd()): Array<{ version: string; path: string; created: Date }> {
  const versionsDir = path.join(workingDir, AI_FOLDER_STRUCTURE.ROOT, AI_FOLDER_STRUCTURE.VERSIONS, functionName)

  if (!fs.existsSync(versionsDir)) {
    return []
  }

  const versions: Array<{ version: string; path: string; created: Date }> = []
  const files = fs.readdirSync(versionsDir)

  for (const file of files) {
    if (file.endsWith('.md') || file.endsWith('.mdx')) {
      const version = path.basename(file, path.extname(file))
      const filePath = path.join(versionsDir, file)
      const stats = fs.statSync(filePath)
      versions.push({ version, path: filePath, created: stats.birthtime })
    }
  }

  return versions.sort((a, b) => b.created.getTime() - a.created.getTime())
}
