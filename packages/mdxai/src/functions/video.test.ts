import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { video, VideoConfig, VideoResult } from './video'
import { promises as fs } from 'fs'
import { join } from 'path'

// Mock the GoogleGenAI module
const mockGenerateVideos = vi.fn()
const mockGetVideosOperation = vi.fn()

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateVideos: mockGenerateVideos,
    },
    operations: {
      getVideosOperation: mockGetVideosOperation,
    },
  })),
}))

// Mock fs promises
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
  },
  createWriteStream: vi.fn(),
}))

// Mock stream
vi.mock('stream', () => ({
  Readable: {
    fromWeb: vi.fn(),
  },
}))

// Mock fetch
global.fetch = vi.fn()

describe('video function', () => {
  const originalEnv = { ...process.env }
  const mockCacheDir = join(process.cwd(), '.ai/cache')

  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'test-api-key'
    vi.clearAllMocks()
    
    // Mock fs.mkdir to resolve successfully
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    
    // Mock fs.writeFile to resolve successfully
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)
    
    // Set up default mock implementations
    mockGenerateVideos.mockResolvedValue({
      done: true,
      response: {
        generatedVideos: [
          {
            video: {
              uri: 'https://example.com/video.mp4',
            },
          },
        ],
      },
    })
    
    mockGetVideosOperation.mockResolvedValue({
      done: true,
      response: {
        generatedVideos: [
          {
            video: {
              uri: 'https://example.com/video.mp4',
            },
          },
        ],
      },
    })
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('basic video generation', () => {
    it('should generate a video with default configuration', async () => {
      // Mock cache miss
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'))

      // Mock successful video download
      const mockResponse = {
        ok: true,
        body: new ReadableStream(),
      }
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      // Mock stream handling
      const mockWriter = {
        on: vi.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 0)
          }
        }),
      }
      const { createWriteStream } = await import('fs')
      vi.mocked(createWriteStream).mockReturnValue(mockWriter as any)

      const { Readable } = await import('stream')
      const mockReadable = {
        pipe: vi.fn().mockReturnValue(mockWriter),
      }
      vi.mocked(Readable.fromWeb).mockReturnValue(mockReadable as any)

      const config: VideoConfig = {
        prompt: 'A beautiful sunset over the ocean',
      }

      const result = await video(config)

      expect(result).toBeDefined()
      expect(result.prompt).toBe(config.prompt)
      expect(result.videoFilePaths).toHaveLength(1)
      expect(result.metadata.model).toBe('veo-2.0-generate-001')
      expect(result.metadata.aspectRatio).toBe('16:9')
      expect(result.metadata.personGeneration).toBe('allow')
    })

    it('should use custom configuration options', async () => {
      // Mock cache miss
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'))

      // Mock successful video download
      const mockResponse = {
        ok: true,
        body: new ReadableStream(),
      }
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      // Mock stream handling
      const mockWriter = {
        on: vi.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 0)
          }
        }),
      }
      const { createWriteStream } = await import('fs')
      vi.mocked(createWriteStream).mockReturnValue(mockWriter as any)

      const { Readable } = await import('stream')
      const mockReadable = {
        pipe: vi.fn().mockReturnValue(mockWriter),
      }
      vi.mocked(Readable.fromWeb).mockReturnValue(mockReadable as any)

      const config: VideoConfig = {
        prompt: 'A cat playing with a ball',
        model: 'veo-2.0-generate-001',
        personGeneration: 'dont_allow',
        aspectRatio: '9:16',
        maxWaitTimeSeconds: 120,
        pollingIntervalSeconds: 5,
      }

      const result = await video(config)

      expect(result.metadata.model).toBe('veo-2.0-generate-001')
      expect(result.metadata.aspectRatio).toBe('9:16')
      expect(result.metadata.personGeneration).toBe('dont_allow')
    })
  })

  describe('caching', () => {
    it('should return cached result when available and files exist', async () => {
      const cachedResult: VideoResult = {
        videoFilePaths: ['/path/to/cached/video.mp4'],
        prompt: 'Test prompt',
        metadata: {
          model: 'veo-2.0-generate-001',
          aspectRatio: '16:9',
          personGeneration: 'allow',
          generationTimeMs: 5000,
          completedAt: '2024-01-01T00:00:00.000Z',
        },
      }

      // Mock cache hit
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(cachedResult))
      
      // Mock file existence check
      vi.mocked(fs.access).mockResolvedValue(undefined)

      const config: VideoConfig = {
        prompt: 'Test prompt',
      }

      const result = await video(config)

      expect(result).toEqual(cachedResult)
      expect(fs.readFile).toHaveBeenCalled()
      expect(fs.access).toHaveBeenCalled()
    })

    it('should regenerate when cached files are missing', async () => {
      const cachedResult: VideoResult = {
        videoFilePaths: ['/path/to/missing/video.mp4'],
        prompt: 'Test prompt',
        metadata: {
          model: 'veo-2.0-generate-001',
          aspectRatio: '16:9',
          personGeneration: 'allow',
          generationTimeMs: 5000,
          completedAt: '2024-01-01T00:00:00.000Z',
        },
      }

      // Mock cache hit but file missing
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(cachedResult))
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'))

      const mockOperation = {
        done: true,
        response: {
          generatedVideos: [
            {
              video: {
                uri: 'https://example.com/video.mp4',
              },
            },
          ],
        },
      }

      const { GoogleGenAI } = await import('@google/genai')
      const mockAI = new GoogleGenAI({ apiKey: 'test' })
      vi.mocked(mockAI.models.generateVideos).mockResolvedValue(mockOperation)

      // Mock successful video download
      const mockResponse = {
        ok: true,
        body: new ReadableStream(),
      }
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      // Mock stream handling
      const mockWriter = {
        on: vi.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 0)
          }
        }),
      }
      const { createWriteStream } = await import('fs')
      vi.mocked(createWriteStream).mockReturnValue(mockWriter as any)

      const { Readable } = await import('stream')
      const mockReadable = {
        pipe: vi.fn().mockReturnValue(mockWriter),
      }
      vi.mocked(Readable.fromWeb).mockReturnValue(mockReadable as any)

      const config: VideoConfig = {
        prompt: 'Test prompt',
      }

      const result = await video(config)

      expect(result.prompt).toBe(config.prompt)
      expect(mockAI.models.generateVideos).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should throw error when GOOGLE_API_KEY is not set', async () => {
      delete process.env.GOOGLE_API_KEY

      // Mock cache miss
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'))

      const config: VideoConfig = {
        prompt: 'Test prompt',
      }

      await expect(video(config)).rejects.toThrow('GOOGLE_API_KEY environment variable is not set.')
    })

    it('should handle video download failure', async () => {
      const mockOperation = {
        done: true,
        response: {
          generatedVideos: [
            {
              video: {
                uri: 'https://example.com/video.mp4',
              },
            },
          ],
        },
      }

      const { GoogleGenAI } = await import('@google/genai')
      const mockAI = new GoogleGenAI({ apiKey: 'test' })
      vi.mocked(mockAI.models.generateVideos).mockResolvedValue(mockOperation)

      // Mock cache miss
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'))

      // Mock failed video download
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      const config: VideoConfig = {
        prompt: 'Test prompt',
      }

      await expect(video(config)).rejects.toThrow('Failed to download video: 404 Not Found')
    })

    it('should handle timeout when video generation takes too long', async () => {
      const mockOperation = {
        done: false,
      }

      const { GoogleGenAI } = await import('@google/genai')
      const mockAI = new GoogleGenAI({ apiKey: 'test' })
      vi.mocked(mockAI.models.generateVideos).mockResolvedValue(mockOperation)
      vi.mocked(mockAI.operations.getVideosOperation).mockResolvedValue(mockOperation)

      // Mock cache miss
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'))

      const config: VideoConfig = {
        prompt: 'Test prompt',
        maxWaitTimeSeconds: 1, // Very short timeout for testing
        pollingIntervalSeconds: 0.1,
      }

      await expect(video(config)).rejects.toThrow('Video generation timed out after 1 seconds')
    })
  })

  describe('polling behavior', () => {
    it('should poll until operation is complete', async () => {
      const incompleteOperation = { done: false }
      const completeOperation = {
        done: true,
        response: {
          generatedVideos: [
            {
              video: {
                uri: 'https://example.com/video.mp4',
              },
            },
          ],
        },
      }

      const { GoogleGenAI } = await import('@google/genai')
      const mockAI = new GoogleGenAI({ apiKey: 'test' })
      vi.mocked(mockAI.models.generateVideos).mockResolvedValue(incompleteOperation)
      vi.mocked(mockAI.operations.getVideosOperation)
        .mockResolvedValueOnce(incompleteOperation)
        .mockResolvedValueOnce(completeOperation)

      // Mock cache miss
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'))

      // Mock successful video download
      const mockResponse = {
        ok: true,
        body: new ReadableStream(),
      }
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      // Mock stream handling
      const mockWriter = {
        on: vi.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 0)
          }
        }),
      }
      const { createWriteStream } = await import('fs')
      vi.mocked(createWriteStream).mockReturnValue(mockWriter as any)

      const { Readable } = await import('stream')
      const mockReadable = {
        pipe: vi.fn().mockReturnValue(mockWriter),
      }
      vi.mocked(Readable.fromWeb).mockReturnValue(mockReadable as any)

      const config: VideoConfig = {
        prompt: 'Test prompt',
        pollingIntervalSeconds: 0.1, // Fast polling for testing
      }

      const result = await video(config)

      expect(result).toBeDefined()
      expect(mockAI.operations.getVideosOperation).toHaveBeenCalledTimes(2)
    })
  })
}) 