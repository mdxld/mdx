import { promises as fs } from 'fs'
import path from 'path'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { useMDXComponents } from '../../mdx-components.js'
import { notFound } from 'next/navigation'

async function getProjectRoot() {
  return process.env.MDXE_PROJECT_ROOT || process.cwd()
}

async function findFileWithExtensions(basePath, extensions = ['md', 'mdx']) {
  try {
    await fs.access(basePath)
    const stats = await fs.stat(basePath)
    if (stats.isFile()) {
      return basePath
    }
  } catch {
  }
  
  for (const ext of extensions) {
    const filePath = `${basePath}.${ext}`
    try {
      await fs.access(filePath)
      return filePath
    } catch {
      continue
    }
  }
  
  return null
}

async function getMDXContent(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return content
  } catch (error) {
    console.error('Error reading MDX file:', error)
    return null
  }
}

async function findIndexFile(projectRoot) {
  const possibleFiles = ['README.md', 'README.mdx', 'index.md', 'index.mdx', 'page.md', 'page.mdx']
  
  for (const file of possibleFiles) {
    const filePath = path.join(projectRoot, file)
    try {
      await fs.access(filePath)
      return filePath
    } catch {
      continue
    }
  }
  
  return null
}

export default async function CatchAllPage({ params }) {
  const resolvedParams = await params
  const pathSegments = resolvedParams.path || []
  
  const projectRoot = await getProjectRoot()
  
  if (pathSegments.length === 0) {
    const indexFile = await findIndexFile(projectRoot)
    
    if (!indexFile) {
      return (
        <div className="prose prose-lg mx-auto">
          <h1>Welcome to MDXE</h1>
          <p>No index file found. Create a README.md, index.md, or page.md file to get started.</p>
          <p>Project root: <code>{projectRoot}</code></p>
        </div>
      )
    }
    
    const content = await getMDXContent(indexFile)
    
    if (!content) {
      return (
        <div className="prose prose-lg mx-auto">
          <h1>Error</h1>
          <p>Could not read the index file: {indexFile}</p>
        </div>
      )
    }
    
    const components = useMDXComponents()
    
    return (
      <div className="prose prose-lg mx-auto">
        <MDXRemote source={content} components={components} />
      </div>
    )
  }
  
  const requestedPath = path.join(projectRoot, ...pathSegments)
  
  const normalizedProjectRoot = path.resolve(projectRoot)
  const normalizedRequestedPath = path.resolve(requestedPath)
  
  if (!normalizedRequestedPath.startsWith(normalizedProjectRoot)) {
    notFound()
  }
  
  const filePath = await findFileWithExtensions(requestedPath)
  
  if (!filePath) {
    notFound()
  }
  
  const content = await getMDXContent(filePath)
  
  if (!content) {
    notFound()
  }
  
  const components = useMDXComponents()
  
  return (
    <div className="prose prose-lg mx-auto">
      <MDXRemote source={content} components={components} />
    </div>
  )
}
