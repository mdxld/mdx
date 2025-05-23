import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'node:fs'

/**
 * Build MDX files using mdxld
 */
export async function buildWithMdxld(options: {
  sourceDir?: string
  outputDir?: string
  configFile?: string
  watch?: boolean
}): Promise<any> {
  const { sourceDir = '.', outputDir = '.mdx', configFile, watch = false } = options
  
  console.log('Building MDX files using mdxld...')
  
  const args = [
    'mdxld', 'build',
    '--source', sourceDir,
    '--output', outputDir
  ]
  
  if (configFile) {
    args.push('--config', configFile)
  }
  
  if (watch) {
    args.push('--watch')
  }
  
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npx', args, {
      stdio: 'pipe',
      shell: true
    })
    
    let stdout = ''
    let stderr = ''
    
    buildProcess.stdout.on('data', (data) => {
      const dataStr = data.toString()
      stdout += dataStr
      console.log(`mdxld build stdout: ${dataStr}`)
    })
    
    buildProcess.stderr.on('data', (data) => {
      const dataStr = data.toString()
      stderr += dataStr
      console.error(`mdxld build stderr: ${dataStr}`)
    })
    
    buildProcess.on('close', (code) => {
      console.log(`mdxld build process exited with code ${code}`)
      
      if (code !== 0) {
        reject(new Error(`mdxld build failed with code ${code}: ${stderr}`))
        return
      }
      
      try {
        const outputFile = path.join(outputDir, 'mdx.json')
        if (fs.existsSync(outputFile)) {
          const data = JSON.parse(fs.readFileSync(outputFile, 'utf8'))
          resolve(data)
        } else {
          resolve({}) // Return empty object if no output file
        }
      } catch (error) {
        console.error('Error reading mdxld output:', error)
        resolve({}) // Return empty object on error
      }
    })
    
    buildProcess.on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * Watch MDX files using mdxld CLI
 */
export function watchWithMdxld(options: {
  sourceDir?: string
  outputDir?: string
  configFile?: string
}): ChildProcess {
  const { sourceDir = '.', outputDir = '.mdx', configFile } = options
  
  const args = [
    'mdxld', 'build',
    '--source', sourceDir,
    '--output', outputDir,
    '--watch'
  ]
  
  if (configFile) {
    args.push('--config', configFile)
  }
  
  console.log(`Starting mdxld watch process with args: ${args.join(' ')}`)
  
  const watchProcess = spawn('npx', args, {
    stdio: 'pipe',
    shell: true
  })
  
  watchProcess.stdout.on('data', (data) => {
    console.log(`mdxld watch stdout: ${data}`)
  })
  
  watchProcess.stderr.on('data', (data) => {
    console.error(`mdxld watch stderr: ${data}`)
  })
  
  watchProcess.on('close', (code) => {
    console.log(`mdxld watch process exited with code ${code}`)
  })
  
  return watchProcess
}
