import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'

/**
 * Start the production server for the MDXE project
 */
export async function runStartCommand(cwd: string = process.cwd()) {
  try {
    const isNextProject = await isNextJsProject(cwd)

    if (isNextProject) {
      console.log('📦 Detected Next.js project, starting Next.js production server...')
      return startNextServer(cwd)
    } else {
      console.log('📦 Starting embedded MDXE Next.js production server...')
      return startEmbeddedNextServer(cwd)
    }
  } catch (error) {
    console.error('Error starting production server:', error)
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
 * Start the Next.js production server
 */
function startNextServer(cwd: string) {
  return new Promise<void>((resolve, reject) => {
    const nextDir = path.join(cwd, '.next')
    fs.access(nextDir)
      .then(() => {
        const nextBin = path.join(cwd, 'node_modules', '.bin', 'next')

        fs.access(nextBin)
          .then(() => {
            const nextProcess = spawn(nextBin, ['start'], {
              cwd,
              stdio: 'inherit',
              shell: true,
            })

            nextProcess.on('error', (error) => {
              console.error('Failed to start Next.js production server:', error)
              reject(error)
            })

            nextProcess.on('close', (code) => {
              if (code !== 0) {
                console.error(`Next.js production server exited with code ${code}`)
                reject(new Error(`Next.js production server exited with code ${code}`))
              } else {
                resolve()
              }
            })
          })
          .catch(() => {
            const nextProcess = spawn('npx', ['next', 'start'], {
              cwd,
              stdio: 'inherit',
              shell: true,
            })

            nextProcess.on('error', (error) => {
              console.error('Failed to start Next.js production server:', error)
              reject(error)
            })

            nextProcess.on('close', (code) => {
              if (code !== 0) {
                console.error(`Next.js production server exited with code ${code}`)
                reject(new Error(`Next.js production server exited with code ${code}`))
              } else {
                resolve()
              }
            })
          })
      })
      .catch(() => {
        console.error('❌ No .next directory found. Please run `mdxe build` first.')
        process.exit(1)
      })
  })
}

/**
 * Start the embedded Next.js production server
 */
function startEmbeddedNextServer(cwd: string) {
  return new Promise<void>((resolve, reject) => {
    const currentFileUrl = new URL(import.meta.url)
    const currentDir = path.dirname(currentFileUrl.pathname)
    const embeddedAppPath = path.resolve(currentDir, '../..')
    const nextDir = path.join(embeddedAppPath, '.next')
    
    fs.access(nextDir)
      .then(() => {
        console.log('📦 Starting embedded MDXE Next.js production server...')
        const nextBin = path.join(embeddedAppPath, 'node_modules', '.bin', 'next')
        const nextProcess = spawn(nextBin, ['start'], {
          cwd: embeddedAppPath,
          stdio: 'inherit',
          shell: true,
          env: {
            ...process.env,
            MDXE_PROJECT_ROOT: cwd,
          },
        })

        nextProcess.on('error', (error) => {
          console.error('Failed to start embedded Next.js production server:', error)
          reject(error)
        })

        nextProcess.on('close', (code) => {
          if (code !== 0) {
            console.error(`Embedded Next.js production server exited with code ${code}`)
            reject(new Error(`Embedded Next.js production server exited with code ${code}`))
          } else {
            resolve()
          }
        })
      })
      .catch(() => {
        console.error('❌ No .next directory found in embedded app. Please run `mdxe build` first.')
        process.exit(1)
      })
  })
}

/**
 * Check if a file or directory exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}
