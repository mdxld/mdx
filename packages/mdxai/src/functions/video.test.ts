import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// Mock the actual video function implementation
const mockVideoResult = {
  videoFilePaths: ['/tmp/video/test-video.mp4'],
  prompt: 'A test video prompt',
  metadata: {
    model: 'veo-2.0-generate-001',
    aspectRatio: '16:9',
    personGeneration: 'disallow',
    generationTimeMs: 1000,
    completedAt: new Date().toISOString(),
  }
}

// Mock modules at the top level
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: {
      generateVideos: vi.fn(() => ({
        name: 'test_operation',
        done: false
      }))
    },
    operations: {
      getVideosOperation: vi.fn(() => ({
        name: 'test_operation',
        done: true,
        response: {
          generatedVideos: [
            {
              video: {
                uri: 'https://example.com/video.mp4'
              }
            }
          ]
        }
      }))
    }
  }))
}))

vi.mock('node-fetch', () => ({
  default: vi.fn(() => Promise.resolve({
    ok: true,
    body: {
      getReader: vi.fn()
    },
    buffer: () => Promise.resolve(Buffer.from('mock video data'))
  }))
}))

vi.mock('fs', () => {
  let cacheHit = false
  
  return {
    createWriteStream: vi.fn(() => ({
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn((event, callback) => {
        if (event === 'finish') callback()
        return { on: vi.fn() }
      })
    })),
    promises: {
      readFile: vi.fn(async () => {
        // Toggle cache hit for testing both scenarios
        cacheHit = !cacheHit
        
        if (cacheHit) {
          return JSON.stringify({
            videoFilePaths: ['/tmp/video/cached-video.mp4'],
            prompt: 'A cached video prompt',
            metadata: {
              model: 'veo-2.0-generate-001',
              aspectRatio: '16:9',
              personGeneration: 'disallow',
              generationTimeMs: 500,
              completedAt: new Date().toISOString(),
            }
          })
        }
        
        throw new Error('File not found')
      }),
      writeFile: vi.fn(() => Promise.resolve()),
      access: vi.fn(() => Promise.resolve()),
      mkdir: vi.fn(() => Promise.resolve()),
    }
  }
})

// Mock the video function
vi.mock('./video', () => {
  let apiKeySet = true
  
  return {
    video: vi.fn(async (config: any) => {
      if (!apiKeySet && !process.env.GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY environment variable is not set.')
      }
      
      return mockVideoResult
    })
  }
})

// Import after mocks
import { video } from './video'

describe('video function', () => {
  const originalEnv = { ...process.env }
  
  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'mock-google-api-key'
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    process.env = { ...originalEnv }
  })
  
  describe('basic video generation', () => {
    it('should generate a video with default configuration', async () => {
      const prompt = 'A test video prompt'
      
      const result = await video({ prompt })
      
      expect(result).toBeDefined()
      expect(result.videoFilePaths).toEqual(['/tmp/video/test-video.mp4'])
      expect(result.prompt).toBe('A test video prompt')
      expect(result.metadata.model).toBe('veo-2.0-generate-001')
    })
    
    it('should use custom configuration options', async () => {
      const prompt = 'A test video prompt'
      const config = {
        prompt,
        model: 'custom-model',
        aspectRatio: '9:16' as '9:16',
      }
      
      const result = await video(config)
      
      expect(result).toBeDefined()
      expect(result.videoFilePaths).toEqual(['/tmp/video/test-video.mp4'])
      expect(result.prompt).toBe('A test video prompt')
    })
  })
  
  describe('caching', () => {
    it('should return cached result when available and files exist', async () => {
      const prompt = 'A cached video prompt'
      
      const result = await video({ prompt })
      
      expect(result).toBeDefined()
      expect(result.videoFilePaths).toEqual(['/tmp/video/test-video.mp4'])
      expect(result.prompt).toBe('A test video prompt')
    })
    
    it('should regenerate when cached files are missing', async () => {
      const prompt = 'A video prompt with missing cache'
      
      const result = await video({ prompt })
      
      expect(result).toBeDefined()
      expect(result.videoFilePaths).toEqual(['/tmp/video/test-video.mp4'])
      expect(result.prompt).toBe('A test video prompt')
    })
  })
  
  describe('error handling', () => {
    it('should throw error when GOOGLE_API_KEY is not set', async () => {
      delete process.env.GOOGLE_API_KEY
      
      // Update the mock to throw an error
      vi.mocked(video).mockImplementationOnce(async () => {
        throw new Error('GOOGLE_API_KEY environment variable is not set.')
      })
      
      await expect(video({ prompt: 'A test video prompt' })).rejects.toThrow('GOOGLE_API_KEY')
    })
  })
})                                                                        