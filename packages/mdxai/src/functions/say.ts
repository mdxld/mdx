import fs from 'fs'
import path from 'path'
import { GoogleGenAI } from '@google/genai'
import wav from 'wav'
import hash from 'object-hash'
import { parseTemplate } from '../utils/template.js'
import { AI_FOLDER_STRUCTURE, ensureDirectoryExists } from '../utils.js'

/**
 * Say template literal function for text-to-speech generation
 *
 * Usage: await say`Say cheerfully: Have a wonderful day!`
 */
export type SayTemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<string>

/**
 * Save audio buffer as WAV file
 */
async function saveWaveFile(
  filename: string,
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const writer = new wav.FileWriter(filename, {
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    })

    writer.on('finish', () => resolve())
    writer.on('error', (error) => reject(error))

    writer.write(pcmData)
    writer.end()
  })
}

/**
 * Generate audio using Google Gemini TTS
 */
async function generateSpeechAudio(text: string, options: { voiceName?: string; apiKey?: string; baseURL?: string } = {}): Promise<string> {
  const apiKey = options.apiKey || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY must be provided via apiKey parameter or GOOGLE_API_KEY environment variable.')
  }

  const baseUrl = options.baseURL || process.env.AI_GATEWAY_URL?.replace('openrouter','google-ai-studio')
  const ai = new GoogleGenAI({ apiKey, httpOptions: { baseUrl } })

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: options.voiceName || 'Kore' },
        },
      },
    },
  })

  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
  if (!data) {
    throw new Error('No audio data received from Google GenAI')
  }

  const audioBuffer = Buffer.from(data, 'base64')
  
  const cacheKey = hash({ text, voiceName: options.voiceName || 'Kore' })
  const cacheDir = path.join(process.cwd(), AI_FOLDER_STRUCTURE.ROOT, AI_FOLDER_STRUCTURE.CACHE)
  ensureDirectoryExists(cacheDir)
  
  const fileName = path.join(cacheDir, `${cacheKey}.wav`)
  await saveWaveFile(fileName, audioBuffer)
  
  return fileName
}

const sayFunction_: SayTemplateFn = function (template: TemplateStringsArray, ...values: any[]) {
  if (Array.isArray(template) && 'raw' in template) {
    const text = parseTemplate(template, values)
    
    let options: { voiceName?: string; apiKey?: string; baseURL?: string } = {}
    if (values.length > 0 && typeof values[values.length - 1] === 'object' && !(values[values.length - 1] instanceof Array)) {
      options = values.pop() as { voiceName?: string; apiKey?: string; baseURL?: string }
    }
    
    return generateSpeechAudio(text, options)
  }

  throw new Error('Say function must be called as a template literal')
}

export const say = new Proxy(sayFunction_, {
  get(target, prop) {
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return undefined
    }

    if (typeof prop === 'symbol') {
      return Reflect.get(target, prop)
    }

    return target
  },

  apply(target, thisArg, args) {
    if (Array.isArray(args[0]) && 'raw' in args[0]) {
      const text = parseTemplate(args[0] as TemplateStringsArray, args.slice(1))
      
      let options: { voiceName?: string; apiKey?: string; baseURL?: string } = {}
      if (args.length > 1 && typeof args[args.length - 1] === 'object' && !(args[args.length - 1] instanceof Array)) {
        options = args[args.length - 1] as { voiceName?: string; apiKey?: string; baseURL?: string }
      }
      
      return generateSpeechAudio(text, options)
    }

    throw new Error('Say function must be called as a template literal')
  },
})            