import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import React, { useState, useEffect, useRef } from 'react'
import { render, Box, Text, useApp } from 'ink'
import WebSocket from 'ws'
// @ts-ignore
import Mic from 'mic'
import Speaker from 'speaker'

// Load .env from root of the repository
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../..', '.env') })

// Note: To suppress mpg123 buffer warnings, run with: npm start 2>&1 | grep -v "warning: Didn't have any audio data"

const API_KEY = process.env.OPENAI_API_KEY
if (!API_KEY) {
  console.error('❌ CRITICAL: OPENAI_API_KEY environment variable not found!')
  console.error('Please create a .env file in the project root with:')
  console.error('OPENAI_API_KEY=your_api_key_here')
  process.exit(1)
}

const MODEL = 'gpt-4o-realtime-preview-2024-12-17' // Model from new WSS example
const SAMPLE_RATE = 24000 // Sample rate for PCM-16 as per examples
const CHANNELS = 1
const BIT_DEPTH = 16

// Global cleanup function to ensure resources are freed
let globalCleanup: (() => void) | null = null

// Function to generate a short beep (sine wave PCM data)
const generateBeepPCM = (durationSeconds: number, frequencyHz: number, sampleRate: number): Buffer => {
  const numSamples = Math.floor(durationSeconds * sampleRate)
  const buffer = Buffer.alloc(numSamples * 2) // 16-bit => 2 bytes per sample
  const amplitude = 16383 // Max amplitude for 16-bit signed, using ~half for safety

  for (let i = 0; i < numSamples; i++) {
    const time = i / sampleRate
    const sampleValue = Math.floor(amplitude * Math.sin(2 * Math.PI * frequencyHz * time))
    buffer.writeInt16LE(sampleValue, i * 2)
  }
  return buffer
}

// Clean logging system
let logCount = 0
const log = (category: string, message: string, data?: any) => {
  logCount++
  const timestamp = new Date().toISOString().slice(11, 23) // Just time part
  console.log(`[${logCount.toString().padStart(3, '0')}] ${timestamp} ${category}: ${message}`)
  if (data) {
    console.log(`    Data: ${JSON.stringify(data, null, 2).replace(/\n/g, '\n    ')}`)
  }
}

// API key is loaded
log('INIT', 'API key configured')

const App: React.FC = () => {
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)

  const audioBufferRef = useRef<Buffer[]>([]) // Store audio chunks
  const microphoneMutedRef = useRef(false) // Track if mic should be muted
  const { exit } = useApp()

  useEffect(() => {
    let ws: WebSocket | null = null
    let micInstance: Mic | null = null
    let speakerInstance: Speaker | null = null
    let isCleaningUp = false
    let micStream: any = null

    // // Auto-kill after 10 seconds for testing
    // const autoKillTimer = setTimeout(() => {
    //   console.log('\n⏰ 10 seconds elapsed - auto-killing for testing...');
    //   if (globalCleanup) {
    //     globalCleanup();
    //   }
    // }, 10000);

    const stopMicrophone = () => {
      if (micInstance && micStream) {
        try {
          micInstance.stop()
          log('🔇', 'Microphone stopped')
        } catch (err) {
          log('ERROR', 'Error stopping microphone', { error: err })
        }
      }
    }

    const startMicrophone = () => {
      if (micInstance && !isCleaningUp) {
        try {
          micInstance.start()
          log('🎤', 'Microphone started')
        } catch (err) {
          log('ERROR', 'Error starting microphone', { error: err })
        }
      }
    }

    const setupRealtimeConnection = () => {
      micInstance = Mic({
        rate: String(SAMPLE_RATE),
        channels: String(CHANNELS),
        bitwidth: String(BIT_DEPTH),
        encoding: 'signed-integer',
        device: 'default',
      })
      micStream = (micInstance as Mic).getAudioStream()

      speakerInstance = new Speaker({
        channels: CHANNELS,
        sampleRate: SAMPLE_RATE,
        bitDepth: BIT_DEPTH,
      })

      // Play a startup beep to test speaker
      const beepSound = generateBeepPCM(0.3, 440, SAMPLE_RATE)
      if (speakerInstance) {
        speakerInstance.write(beepSound)
      }

      log('INIT', 'Connecting to OpenAI Realtime API')
      const websocketUrl = `wss://api.openai.com/v1/realtime?model=${MODEL}`

      ws = new WebSocket(websocketUrl, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      })

      // micStream is now defined in this scope
      ws.on('open', () => {
        log('INIT', 'Connected to OpenAI')

        // Don't send initial test message - wait for user to speak first
        // if (ws && ws.readyState === WebSocket.OPEN) {
        //   const testMessage = {
        //     type: 'response.create',
        //     response: {
        //       modalities: ['text', 'audio'],
        //       instructions: 'Say hello in a friendly voice'
        //     }
        //   };
        //   ws.send(JSON.stringify(testMessage));
        // }

        // Start microphone
        if (micInstance) {
          micInstance.start()
          setListening(true)
          log('INIT', 'Ready for conversation - speak to begin')
        }
      })

      let micDataCount = 0
      micStream.on('data', (chunk: Buffer) => {
        if (isCleaningUp || microphoneMutedRef.current) return // Don't process data during cleanup or when AI is speaking
        micDataCount++

        if (ws && ws.readyState === WebSocket.OPEN) {
          const base64Audio = chunk.toString('base64')
          ;(ws as WebSocket).send(
            JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64Audio,
            }),
          )

          // Log every 100 chunks to monitor mic activity
          if (micDataCount % 100 === 0) {
            log('MIC', `Sent ${micDataCount} audio chunks to API`)
          }
        }
      })

      micStream.on('error', (err: Error) => {
        log('ERROR', 'Microphone stream error', { error: err.message })
        cleanup()
      })

      ws.on('message', (data) => {
        if (isCleaningUp) return // Don't process new messages during cleanup

        // Process incoming messages

        try {
          const dataString = typeof data === 'string' ? data : data.toString()
          const msg = JSON.parse(dataString)

          // Log important message types only
          if (msg.type === 'session.created') {
            log('SETUP', 'Session established')
          } else if (msg.type === 'input_audio_buffer.speech_started') {
            log('🎤', 'Speech detected')
          } else if (msg.type === 'response.audio.done') {
            log('🔊', 'Playing AI response')
          }

          switch (msg.type) {
            case 'response.audio.delta':
              if (msg.delta) {
                const audioBuffer = Buffer.from(msg.delta, 'base64')
                audioBufferRef.current.push(audioBuffer)
              }
              break
            case 'response.audio.start':
              // Completely stop microphone when AI starts speaking
              stopMicrophone()
              microphoneMutedRef.current = true
              setAiSpeaking(true)
              setListening(false)
              log('🔇', 'Stopping microphone - AI speaking')
              break
            case 'session.created':
              if (ws && ws.readyState === WebSocket.OPEN) {
                const updatePayload = {
                  type: 'session.update',
                  session: {
                    modalities: ['text', 'audio'],
                    input_audio_format: 'pcm16',
                    output_audio_format: 'pcm16',
                    input_audio_transcription: {
                      model: 'whisper-1',
                    },
                    turn_detection: {
                      type: 'server_vad',
                      threshold: 0.6, // Balanced threshold - not too sensitive
                      prefix_padding_ms: 300,
                      silence_duration_ms: 800, // Reasonable silence duration
                      interrupt_response: false,
                    },
                    voice: 'alloy',
                  },
                }
                ws.send(JSON.stringify(updatePayload))
              }
              break
            case 'input_audio_buffer.speech_started':
              log('🎤', 'User speech detected')
              break
            case 'input_audio_buffer.speech_stopped':
              log('🎤', 'User speech ended')
              // Don't manually commit - let the server handle turn detection automatically
              // The server will automatically process the audio when it detects the user has stopped speaking
              break
            case 'response.text.delta':
              setTranscript((t) => t + msg.text)
              break
            case 'response.text.done':
              setTranscript((t) => t + '\n')
              break

            // Remove the duplicate response.audio handler - only use response.audio.done
            case 'response.audio.done':
              if (audioBufferRef.current.length > 0) {
                const combinedAudio = Buffer.concat(audioBufferRef.current)

                if (speakerInstance && !isCleaningUp) {
                  try {
                    speakerInstance.write(combinedAudio)
                    log('🔊', 'Playing AI audio response')

                    // Add a much longer delay before restarting the microphone
                    setTimeout(() => {
                      if (!isCleaningUp) {
                        startMicrophone()
                        microphoneMutedRef.current = false
                        setAiSpeaking(false)
                        setListening(true)
                        log('🎤', 'Restarting microphone - ready for user input')
                      }
                    }, 1500) // 1.5 second delay to let audio finish completely
                  } catch (err) {
                    log('ERROR', 'Audio playback failed', { error: err })
                    startMicrophone()
                    microphoneMutedRef.current = false
                    setAiSpeaking(false)
                    setListening(true)
                  }
                }

                // Clear the buffer for next response
                audioBufferRef.current = []
              } else {
                // If no audio buffer, still restart microphone after a delay
                setTimeout(() => {
                  if (!isCleaningUp) {
                    startMicrophone()
                    microphoneMutedRef.current = false
                    setAiSpeaking(false)
                    setListening(true)
                    log('🎤', 'Restarting microphone - ready for user input')
                  }
                }, 1500)
              }
              break
            case 'response.done':
              // Ensure microphone is restarted when response is completely done
              setTimeout(() => {
                if (!isCleaningUp) {
                  startMicrophone()
                  microphoneMutedRef.current = false
                  setAiSpeaking(false)
                  setListening(true)
                  log('🎤', 'Response complete - microphone ready')
                }
              }, 1000)
              break
            case 'error':
              log('ERROR', 'OpenAI API error', msg)
              // Restart microphone on error
              if (!isCleaningUp) {
                startMicrophone()
                microphoneMutedRef.current = false
                setAiSpeaking(false)
                setListening(true)
              }
              break
            default:
              // Log unknown message types for debugging
              if (msg.type && !msg.type.includes('heartbeat')) {
                log('DEBUG', `Unknown message type: ${msg.type}`)
              }
              break
          }
        } catch (parseError) {
          log('ERROR', 'Failed to parse WebSocket message', { error: (parseError as Error).message, rawData: String(data).substring(0, 100) })
        }
      })

      ws.on('error', (err) => {
        log('ERROR', 'WebSocket error', {
          error: err.message,
          code: (err as any).code,
          type: (err as any).type,
        })
        cleanup()
      })

      ws.on('close', (code, reason) => {
        const reasonStr = reason ? reason.toString() : 'No reason given'
        let logLevel = 'WS'

        // Detect common error codes
        if (code === 1006) {
          logLevel = 'ERROR'
          log(logLevel, 'WebSocket connection failed (abnormal closure)', { code, reason: reasonStr })
        } else if (code === 1011) {
          logLevel = 'ERROR'
          log(logLevel, 'WebSocket server error (possibly authentication)', { code, reason: reasonStr })
        } else if (code === 4001) {
          logLevel = 'ERROR'
          log(logLevel, 'WebSocket unauthorized (invalid API key)', { code, reason: reasonStr })
        } else {
          log(logLevel, 'WebSocket closed', { code, reason: reasonStr })
        }
        cleanup()
      })
    }

    function cleanup() {
      if (isCleaningUp) return // Prevent multiple cleanup calls
      isCleaningUp = true
      log('CLEANUP', 'Starting cleanup process')

      // // Clear auto-kill timer
      // if (autoKillTimer) {
      //   clearTimeout(autoKillTimer);
      // }

      try {
        if (micInstance) {
          log('CLEANUP', 'Stopping microphone')
          micInstance.stop()
        }
      } catch (err) {
        log('ERROR', 'Error stopping microphone', { error: err })
      }

      try {
        if (speakerInstance) {
          log('CLEANUP', 'Ending speaker')
          speakerInstance.end()
          speakerInstance = null
        }
      } catch (err) {
        log('ERROR', 'Error ending speaker', { error: err })
      }

      try {
        if (ws && ws.readyState === WebSocket.OPEN) {
          log('CLEANUP', 'Closing WebSocket')
          ws.close()
        }
      } catch (err) {
        log('ERROR', 'Error closing WebSocket', { error: err })
      }

      setListening(false)
      setAiSpeaking(false)
      microphoneMutedRef.current = false

      // Exit the app
      setTimeout(() => {
        log('STATUS', 'Exiting application')
        exit()
      }, 100)
    }

    // Set global cleanup function for signal handlers
    globalCleanup = cleanup

    setupRealtimeConnection()

    return () => {
      console.log('Component unmounting, running cleanup...')
      cleanup()
    }
  }, [exit])

  return (
    <Box flexDirection='column'>
      <Box>
        <Text>
          {aiSpeaking ? '🔊 AI Speaking...' : listening ? '🎤 Listening...' : '🔇 Not listening'}
          {microphoneMutedRef.current ? ' (Muted)' : ''}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text>{transcript}</Text>
      </Box>
    </Box>
  )
}

// Add signal handlers for graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[SIG] Received SIGINT (Ctrl+C)')
  if (globalCleanup) {
    globalCleanup()
  } else {
    console.log('[SIG] No cleanup function available, forcing exit')
    process.exit(0)
  }
})

process.on('SIGTERM', () => {
  console.log('\n[SIG] Received SIGTERM')
  if (globalCleanup) {
    globalCleanup()
  } else {
    console.log('[SIG] No cleanup function available, forcing exit')
    process.exit(0)
  }
})

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('[ERR] Uncaught Exception:', err.message)
  if (globalCleanup) {
    globalCleanup()
  }
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERR] Unhandled Rejection:', reason)
  if (globalCleanup) {
    globalCleanup()
  }
  process.exit(1)
})

render(<App />)
