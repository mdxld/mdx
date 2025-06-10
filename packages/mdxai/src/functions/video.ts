import { GoogleGenAI } from '@google/genai'
import { createWriteStream } from 'fs'
import { Readable } from 'stream'
import { promises as fs } from 'fs'
import { join } from 'path'
import hash from 'object-hash'
import { createCacheMiddleware } from '../middleware/cache.js'

const CACHE_DIR = join(process.cwd(), '.ai/cache')

const cacheMiddleware = createCacheMiddleware({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 100,
  persistentCache: true,
  memoryCache: true,
})

export interface VideoConfig {
  /** The prompt to generate the video from */
  prompt: string
  /** The model to use for video generation */
  model?: string
  /** Whether to allow person generation in the video (deprecated - no longer supported by the API) */
  personGeneration?: 'allow_adult' | 'disallow'
  /** The aspect ratio of the video */
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3'
  /** The maximum number of seconds to wait for the video generation to complete */
  maxWaitTimeSeconds?: number
  /** The polling interval in seconds */
  pollingIntervalSeconds?: number
  /** Optional API key for Google AI */
  apiKey?: string
  /** Optional base URL for API gateway */
  baseURL?: string
}

export interface VideoResult {
  /** Array of video file paths that were generated */
  videoFilePaths: string[]
  /** The original prompt used to generate the videos */
  prompt: string
  /** Metadata about the generation process */
  metadata: {
    /** The model used for generation */
    model: string
    /** The aspect ratio of the generated videos */
    aspectRatio: string
    /** Whether person generation was allowed */
    personGeneration: string
    /** The time it took to generate the videos in milliseconds */
    generationTimeMs: number
    /** The timestamp when the generation was completed */
    completedAt: string
  }
}

/**
 * Generates videos based on a text prompt using Google's Veo model
 * 
 * @param config - Configuration options for video generation
 * @returns Promise with the generated video file paths and metadata
 */
export async function video(config: VideoConfig): Promise<VideoResult> {
  const {
    prompt,
    model = 'veo-2.0-generate-001',
    personGeneration, // Deprecated parameter, no longer used
    aspectRatio = '16:9',
    maxWaitTimeSeconds = 300, // 5 minutes max wait time
    pollingIntervalSeconds = 10,
  } = config

  const cacheKey = hash({
    prompt,
    model,
    aspectRatio,
  })
  
  const cacheFilePath = join(CACHE_DIR, `${cacheKey}.json`)
  
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    
    try {
      const cachedData = await fs.readFile(cacheFilePath, 'utf-8')
      const cachedResult = JSON.parse(cachedData)
      
      const allFilesExist = await Promise.all(
        cachedResult.videoFilePaths.map(async (filePath: string) => {
          try {
            await fs.access(filePath)
            return true
          } catch {
            return false
          }
        })
      ).then(results => results.every(Boolean))
      
      if (allFilesExist) {
        console.log(`Cache hit for video generation with key: ${cacheKey}`)
        return cachedResult
      } else {
        console.log(`Cache invalid for video generation with key: ${cacheKey} (missing files)`)
      }
    } catch (error) {
      console.log(`Cache miss for video generation with key: ${cacheKey}`)
    }
    
    const startTime = Date.now()
    
    const baseUrl = config.baseURL || process.env.AI_GATEWAY_URL?.replace('openrouter','google-ai-studio')
    const apiKey = config.apiKey || process.env.GOOGLE_API_KEY || ''
    
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { baseUrl }
    })
    
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY must be provided via apiKey parameter or GOOGLE_API_KEY environment variable.')
    }

    
    let operation = await ai.models.generateVideos({
      model,
      prompt,
      config: {
        aspectRatio,
      },
    })
    
    const maxEndTime = startTime + (maxWaitTimeSeconds * 1000)
    while (!operation.done) {
      if (Date.now() > maxEndTime) {
        throw new Error(`Video generation timed out after ${maxWaitTimeSeconds} seconds`)
      }
      
      await new Promise((resolve) => setTimeout(resolve, pollingIntervalSeconds * 1000))
      
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      })
    }
    
    const videoFilePaths: string[] = []
    
    if (operation.response?.generatedVideos && operation.response.generatedVideos.length > 0) {
      await Promise.all(
        operation.response.generatedVideos.map(async (generatedVideo, index) => {
          if (generatedVideo.video?.uri) {
            const videoFileName = `${cacheKey}_${index}.mp4`
            const videoFilePath = join(CACHE_DIR, videoFileName)
            
            const resp = await fetch(`${generatedVideo.video.uri}&key=${apiKey}`)
            
            if (!resp.ok) {
              throw new Error(`Failed to download video: ${resp.status} ${resp.statusText}`)
            }
            
            if (!resp.body) {
              throw new Error('Response body is null')
            }
            
            const writer = createWriteStream(videoFilePath)
            await new Promise<void>((resolve, reject) => {
              Readable.fromWeb(resp.body! as any).pipe(writer)
              writer.on('finish', resolve)
              writer.on('error', reject)
            })
            
            videoFilePaths.push(videoFilePath)
          }
        })
      )
    }
    
    const endTime = Date.now()
    const generationTimeMs = endTime - startTime
    
    const result: VideoResult = {
      videoFilePaths,
      prompt,
      metadata: {
        model,
        aspectRatio,
        personGeneration: personGeneration || 'disallow', // Default value since API no longer supports this parameter
        generationTimeMs,
        completedAt: new Date().toISOString(),
      }
    }
    
    await fs.writeFile(cacheFilePath, JSON.stringify(result, null, 2))
    console.log(`Cached video generation result for key: ${cacheKey}`)
    
    return result
  } catch (error) {
    console.error('Error generating video:', error)
    throw error
  }
}
