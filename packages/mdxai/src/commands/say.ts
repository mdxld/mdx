import * as fs from 'fs'
import * as path from 'path'

export interface SayOptions {
  output?: string
  voice: string
  play: boolean
}

export async function runSayCommand(text: string, options: SayOptions) {
  const { json } = getGlobalOptions()
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      const msg = 'GEMINI_API_KEY environment variable is not set.'
      if (json) {
        console.error(JSON.stringify({ status: 'error', message: msg }))
      } else {
        console.error(msg)
      }
      process.exit(1)
    }

    const { say } = await import('../functions/say.js')
    
    const audioFilePath = await say`${text}`
    
    if (options.output) {
      const outputPath = path.resolve(options.output)
      fs.copyFileSync(audioFilePath, outputPath)
      
      if (json) {
        console.log(JSON.stringify({ status: 'success', audioFile: outputPath }))
      } else {
        console.log(`Audio successfully saved to ${outputPath}`)
      }
    } else if (json) {
      console.log(JSON.stringify({ status: 'success', audioFile: audioFilePath }))
    } else {
      console.log(`Audio successfully generated at ${audioFilePath}`)
    }
    
    if (options.play) {
      try {
        if (process.platform === 'linux') {
          const { spawn } = await import('child_process')
          const player = spawn('aplay', [audioFilePath])
          
          player.on('error', (err) => {
            console.error('Failed to play audio with aplay:', err.message)
            console.log('You can manually play the audio file at:', audioFilePath)
          })
          
          await new Promise<void>((resolve) => {
            player.on('close', () => resolve())
          })
        } 
        else if (process.platform === 'darwin') {
          const { spawn } = await import('child_process')
          const player = spawn('afplay', [audioFilePath])
          
          player.on('error', (err) => {
            console.error('Failed to play audio with afplay:', err.message)
            console.log('You can manually play the audio file at:', audioFilePath)
          })
          
          await new Promise<void>((resolve) => {
            player.on('close', () => resolve())
          })
        }
        else if (process.platform === 'win32') {
          const { spawn } = await import('child_process')
          const player = spawn('powershell', [
            '-c',
            `(New-Object System.Media.SoundPlayer "${audioFilePath}").PlaySync()`
          ])
          
          player.on('error', (err) => {
            console.error('Failed to play audio with PowerShell:', err.message)
            console.log('You can manually play the audio file at:', audioFilePath)
          })
          
          await new Promise<void>((resolve) => {
            player.on('close', () => resolve())
          })
        }
        else {
          console.log('Audio playback not supported on this platform.')
          console.log('You can manually play the audio file at:', audioFilePath)
        }
      } catch (error) {
        console.error('Error playing audio:', error)
        console.log('You can manually play the audio file at:', audioFilePath)
      }
    }
  } catch (error) {
    if (json) {
      console.error(JSON.stringify({ status: 'error', message: String(error) }))
    } else {
      console.error('Error during speech generation:', error)
    }
    process.exit(1)
  }
}

function getGlobalOptions(): { json: boolean } {
  return { json: process.argv.includes('--json') }
}
