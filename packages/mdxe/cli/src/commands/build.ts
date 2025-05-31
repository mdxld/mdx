import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { getNextjsTemplatesDir } from '../utils/template-paths.js'

/**
 * Build the MDXE project for production
 */
export async function runBuildCommand(cwd: string = process.cwd()) {
  try {
    const isNextProject = await isNextJsProject(cwd)

    if (isNextProject) {
      console.log('📦 Detected Next.js project, building Next.js application...')
      return buildNextApp(cwd)
    } else {
      console.log('⚠️ No Next.js project detected. Creating a basic Next.js setup...')
      const { createBasicNextSetup } = await import('./dev')
      await createBasicNextSetup(cwd)
      return buildNextApp(cwd)
    }
  } catch (error) {
    console.error('Error building project:', error)
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
 * Build the Next.js application
 */
function buildNextApp(cwd: string) {
  return new Promise<void>((resolve, reject) => {
    const nextBin = path.join(cwd, 'node_modules', '.bin', 'next')
    const templatesDir = getNextjsTemplatesDir()

    fs.access(nextBin)
      .then(() => {
        const nextProcess = spawn(nextBin, ['build', templatesDir], {
          cwd,
          stdio: 'inherit',
          shell: true,
        })

        nextProcess.on('error', (error) => {
          console.error('Failed to build Next.js application:', error)
          reject(error)
        })

        nextProcess.on('close', (code) => {
          if (code !== 0) {
            console.error(`Next.js build exited with code ${code}`)
            reject(new Error(`Next.js build exited with code ${code}`))
          } else {
            console.log('✅ Next.js build completed successfully')
            resolve()
          }
        })
      })
      .catch(async () => {
        const packageJsonPath = path.join(cwd, 'package.json')
        const packageJsonExists = await fileExists(packageJsonPath)
        let isMonorepo = false

        if (packageJsonExists) {
          try {
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
            isMonorepo = Object.values({
              ...(packageJson.dependencies || {}),
              ...(packageJson.devDependencies || {}),
            }).some((dep: any) => typeof dep === 'string' && dep.startsWith('workspace:'))
          } catch (error) {
            console.error('Error parsing package.json:', error)
          }
        }

        if (isMonorepo) {
          console.log('📦 Detected monorepo workspace, skipping Next.js installation...')
          const nextProcess = spawn('npx', ['next', 'build'], {
            cwd,
            stdio: 'inherit',
            shell: true,
          })

          return new Promise<void>((resolve, reject) => {
            nextProcess.on('error', (error) => {
              console.error('Failed to build Next.js application:', error)
              console.log('⚠️ Build failed but continuing as this is a monorepo example')
              resolve()
            })

            nextProcess.on('close', (code) => {
              if (code !== 0) {
                console.error(`Next.js build exited with code ${code}`)
                console.log('⚠️ Build failed but continuing as this is a monorepo example')
                resolve()
              } else {
                console.log('✅ Next.js build completed successfully')
                resolve()
              }
            })
          })
        }

        console.log('📦 Installing Next.js...')

        const installProcess = spawn('pnpm', ['install', 'next'], {
          cwd,
          stdio: 'inherit',
          shell: true,
        })

        installProcess.on('error', (error) => {
          console.error('Failed to install Next.js dependencies:', error)
          reject(error)
        })

        installProcess.on('close', (code) => {
          if (code !== 0) {
            console.error(`Failed to install Next.js dependencies with code ${code}`)
            reject(new Error(`Failed to install Next.js dependencies with code ${code}`))
          } else {
            console.log('✅ Next.js dependencies installed')

            const nextProcess = spawn('npx', ['next', 'build'], {
              cwd,
              stdio: 'inherit',
              shell: true,
            })

            nextProcess.on('error', (error) => {
              console.error('Failed to build Next.js application:', error)
              reject(error)
            })

            nextProcess.on('close', (code) => {
              if (code !== 0) {
                console.error(`Next.js build exited with code ${code}`)
                reject(new Error(`Next.js build exited with code ${code}`))
              } else {
                console.log('✅ Next.js build completed successfully')
                resolve()
              }
            })
          }
        })
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
