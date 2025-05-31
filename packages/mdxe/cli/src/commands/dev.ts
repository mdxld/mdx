import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { getNextjsTemplatesDir } from '../utils/template-paths.js'
import { findMdxFiles } from '../utils/mdx-parser'
import { findIndexFile, fileExists } from '../utils/file-utils'

/**
 * Start a development server for the MDXE project
 */
export async function runDevCommand(cwd: string = process.cwd()) {
  try {
    // Check if this is a Next.js project
    const isNextProject = await isNextJsProject(cwd)

    if (isNextProject) {
      console.log('📦 Detected Next.js project, starting Next.js development server...')
      return startNextDevServer(cwd)
    } else {
      console.log('⚠️ No Next.js project detected. Creating a basic Next.js setup...')
      await createBasicNextSetup(cwd)
      return startNextDevServer(cwd)
    }
  } catch (error) {
    console.error('Error starting development server:', error)
    process.exit(1)
  }
}

/**
 * Check if the directory is a Next.js project
 */
async function isNextJsProject(dir: string): Promise<boolean> {
  try {
    const packageJsonPath = path.join(dir, 'package.json')
    const packageJsonExists = await fileExists(packageJsonPath)

    if (packageJsonExists) {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
        return true
      }
    }

    const nextConfigPath = path.join(dir, 'next.config.js')
    const nextConfigExists = await fileExists(nextConfigPath)

    const pagesDir = path.join(dir, 'pages')
    const appDir = path.join(dir, 'app')
    const pagesDirExists = await fileExists(pagesDir)
    const appDirExists = await fileExists(appDir)

    return nextConfigExists || pagesDirExists || appDirExists
  } catch (error) {
    console.error('Error checking for Next.js project:', error)
    return false
  }
}

/**
 * Create a basic Next.js setup for MDXE
 */
export async function createBasicNextSetup(dir: string) {
  console.log('✅ Using internal Next.js templates from mdxe package')
  
  const packageJsonPath = path.join(dir, 'package.json')
  const packageJsonExists = await fileExists(packageJsonPath)
  
  if (!packageJsonExists) {
    const packageJson = {
      name: 'mdxe-app',
      version: '1.0.0',
      dependencies: {
        next: '^15.3.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      }
    }
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
    
    console.log('📦 Installing Next.js dependencies...')
    const { spawn } = await import('node:child_process')
    await new Promise<void>((resolve, reject) => {
      const installProcess = spawn('pnpm', ['install'], {
        cwd: dir,
        stdio: 'inherit',
        shell: true,
      })
      
      installProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Dependencies installed successfully')
          resolve()
        } else {
          reject(new Error(`Installation failed with code ${code}`))
        }
      })
      
      installProcess.on('error', reject)
    })
  }
}

/**
 * List MDX files in the directory
 */
async function listMdxFiles(cwd: string) {
  try {
    console.log('📂 MDXE - Markdown/MDX File Browser')
    console.log(`📁 Current directory: ${cwd}`)
    console.log('')

    const mdxFiles = await findMdxFiles(cwd)
    const indexFile = await findIndexFile(cwd)

    if (mdxFiles.length > 0) {
      console.log('📄 Available MDX Files:')
      mdxFiles.forEach((file: string, index: number) => {
        console.log(`  ${index + 1}. ${path.relative(cwd, file)}`)
      })

      if (indexFile) {
        console.log('')
        console.log(`📝 Index file found: ${path.relative(cwd, indexFile)}`)
        const content = await fs.readFile(indexFile, 'utf-8')
        console.log('')
        console.log('--- Content Preview ---')
        console.log(content.substring(0, 500) + '...')
      }
    } else {
      console.log('⚠️ No MDX files found in this directory.')
    }

    console.log('')
    console.log('Press Ctrl+C to quit')

    return new Promise<void>((resolve) => {
      process.on('SIGINT', () => {
        console.log('Exiting MDXE file browser')
        resolve()
      })
    })
  } catch (error) {
    console.error('Error listing MDX files:', error)
    process.exit(1)
  }
}

/**
 * Start the Next.js development server
 */
function startNextDevServer(cwd: string) {
  return new Promise<void>((resolve, reject) => {
    const nextBin = path.join(cwd, 'node_modules', '.bin', 'next')
    const templatesDir = getNextjsTemplatesDir()

    fs.access(nextBin)
      .then(() => {
        console.log('📦 Starting Next.js development server with mdxe templates...')
        const nextProcess = spawn(nextBin, ['dev', '--dir', templatesDir], {
          cwd,
          stdio: 'inherit',
          shell: true,
        })

        nextProcess.on('error', (error) => {
          console.error('Failed to start Next.js development server:', error)
          console.log('⚠️ Falling back to MDXE file browser...')
          listMdxFiles(cwd).then(resolve).catch(reject)
        })

        nextProcess.on('close', (code) => {
          if (code !== 0) {
            console.error(`Next.js development server exited with code ${code}`)
            console.log('⚠️ Falling back to MDXE file browser...')
            listMdxFiles(cwd).then(resolve).catch(reject)
          } else {
            resolve()
          }
        })
      })
      .catch(() => {
        console.log('⚠️ Next.js not found. Using MDXE file browser instead.')
        listMdxFiles(cwd).then(resolve).catch(reject)
      })
  })
}
