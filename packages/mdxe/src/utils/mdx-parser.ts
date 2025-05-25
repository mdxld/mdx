import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'
import fs from 'node:fs/promises'
import path from 'node:path'
import { globby } from 'globby'

/**
 * Represents a code block extracted from MDX content
 */
export interface CodeBlock {
  lang: string
  meta: string | null
  value: string
}

/**
 * Information about MDX slides in a file
 */
export interface SlidesInfo {
  hasSlides: boolean
  slideCount: number
  slidePackage: 'reveal' | 'ink' | 'unknown'
}

/**
 * Extract code blocks from MDX content
 */
export function extractCodeBlocks(mdxContent: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = []

  const tree = unified().use(remarkParse).use(remarkMdx).parse(mdxContent)

  visit(tree, 'code', (node: any) => {
    codeBlocks.push({
      lang: node.lang || '',
      meta: node.meta || null,
      value: node.value || '',
    })
  })

  return codeBlocks
}

/**
 * Find all MDX files in a directory
 */
export async function findMdxFiles(dir: string): Promise<string[]> {
  try {
    const files = await globby(['**/*.md', '**/*.mdx'], {
      cwd: dir,
      absolute: true,
    })

    const filteredFiles = files.filter((file) => {
      return !file.includes('/node_modules/') && !file.includes('/dist/') && !file.includes('/build/') && !file.includes('/.git/')
    })

    return filteredFiles
  } catch (error) {
    console.error('Error finding MDX files:', error)
    return []
  }
}

/**
 * Extract testing and non-testing code blocks from an MDX file
 */
export async function extractMdxCodeBlocks(filePath: string): Promise<{
  testBlocks: CodeBlock[]
  codeBlocks: CodeBlock[]
}> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const blocks = extractCodeBlocks(content)

    const testBlocks = blocks.filter(
      (block) => (block.lang === 'typescript' || block.lang === 'ts' || block.lang === 'js' || block.lang === 'javascript') && block.meta?.includes('test'),
    )

    const codeBlocks = blocks.filter(
      (block) => (block.lang === 'typescript' || block.lang === 'ts' || block.lang === 'js' || block.lang === 'javascript') && !block.meta?.includes('test'),
    )

    return { testBlocks, codeBlocks }
  } catch (error) {
    console.error(`Error extracting code blocks from ${filePath}:`, error)
    return { testBlocks: [], codeBlocks: [] }
  }
}

/**
 * Detect if an MDX file contains Slides components
 */
export async function detectSlides(filePath: string): Promise<SlidesInfo> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    
    const result: SlidesInfo = {
      hasSlides: false,
      slideCount: 0,
      slidePackage: 'unknown'
    }
    
    const revealImportRegex = /import\s+.*?\{\s*Slides\s*,?\s*.*?\}\s+from\s+['"]@mdxui\/reveal['"]/
    const inkImportRegex = /import\s+.*?\{\s*Slides\s*,?\s*.*?\}\s+from\s+['"]@mdxui\/ink['"]/
    
    if (revealImportRegex.test(content)) {
      result.hasSlides = true
      result.slidePackage = 'reveal'
    } else if (inkImportRegex.test(content)) {
      result.hasSlides = true
      result.slidePackage = 'ink'
    }
    
    if (!result.hasSlides) {
      const slidesComponentRegex = /<Slides[^>]*>/g
      const slidesMatches = content.match(slidesComponentRegex)
      
      if (slidesMatches && slidesMatches.length > 0) {
        result.hasSlides = true
      }
    }
    
    if (result.hasSlides) {
      const slideComponentRegex = /<Slide[^>]*>/g
      const slideMatches = content.match(slideComponentRegex)
      
      if (slideMatches) {
        result.slideCount = slideMatches.length
      }
    }
    
    return result
  } catch (error) {
    console.error(`Error detecting slides in ${filePath}:`, error)
    return { hasSlides: false, slideCount: 0, slidePackage: 'unknown' }
  }
}

/**
 * Find the first MDX file with slides in a directory
 */
export async function findSlidesFile(dir: string): Promise<{ filePath: string, slidesInfo: SlidesInfo } | null> {
  try {
    const mdxFiles = await findMdxFiles(dir)
    
    for (const file of mdxFiles) {
      const slidesInfo = await detectSlides(file)
      
      if (slidesInfo.hasSlides) {
        return { filePath: file, slidesInfo }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error finding slides file:', error)
    return null
  }
}
