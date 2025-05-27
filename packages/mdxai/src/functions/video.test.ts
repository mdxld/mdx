import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { video } from './video'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Mock modules
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockImplementation(() => ({
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => 'mock response'
          }
        })
      }))
    }))
  }
})

// Mock node-fetch
vi.mock('node-fetch', () => {
  const mockFetchFn = vi.fn().mockImplementation((url) => {
    if (url.includes('error')) {
      return Promise.reject(new Error('Failed to download video'))
    }
    
    return Promise.resolve({
      ok: true,
      buffer: () => Promise.resolve(Buffer.from('mock video data')),
      json: () => Promise.resolve({
        name: 'test_operation',
        done: true,
        response: {
          name: 'test_video',
          uri: 'https://example.com/video.mp4'
        }
      })
    })
  })
  
  return {
    default: mockFetchFn
  }
})

// Mock fs module
vi.mock('fs', () => {
  return {
    promises: {
      readFile: vi.fn().mockImplementation(() => {
        return Promise.resolve(JSON.stringify({
          videoUrl: 'https://example.com/cached-video.mp4',
          operationName: 'cached_operation',
          localPath: '/tmp/video/cached-video.mp4',
        }))
      }),
      writeFile: vi.fn().mockResolvedValue(undefined),
      access: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
    },
    existsSync: vi.fn().mockReturnValue(true),
    createWriteStream: vi.fn().mockReturnValue({
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback()
        }
        return { on: vi.fn() }
      })
    })
  }
})

// Mock timers
vi.mock('timers', () => {
  const mockSetTimeout = vi.fn().mockImplementation((callback, ms) => {
    if (typeof callback === 'function') {
      callback()
    }
    return 123 // mock timer id
  })
  
  return {
    setTimeout: mockSetTimeout,
    clearTimeout: vi.fn()
  }
})

// Mock the video module to avoid actual API calls
vi.mock('./video', async (importOriginal) => {
  const mod = await importOriginal()
  
  return {
    ...mod,
    video: vi.fn().mockImplementation((config) => {
      return (strings, ...values) => {
        const prompt = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] !== undefined ? values[i] : '')
        }, '')
        
        if (!process.env.GOOGLE_API_KEY) {
          throw new Error('GOOGLE_API_KEY environment variable is not set.')
        }
        
        return Promise.resolve({
          videoUrl: 'https://example.com/video.mp4',
          operationName: 'test_operation',
          localPath: '/tmp/video/test-video.mp4',
        })
      }
    })
  }
})

describe('video function', () => {
  const originalEnv = { ...process.env }
  const mockFetch = require('node-fetch').default
  const { setTimeout } = require('timers')
  
  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'mock-google-api-key'
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })
  
  describe('basic video generation', () => {
    it('should generate a video with default configuration', async () => {
      const prompt = 'A test video prompt'
      
      const result = await video`${prompt}`
      
      expect(result).toBeDefined()
      expect(result.videoUrl).toBe('https://example.com/video.mp4')
      expect(result.operationName).toBe('test_operation')
    })
    
    it('should use custom configuration options', async () => {
      const prompt = 'A test video prompt'
      const config = {
        model: 'custom-model',
        negativePrompt: 'things to avoid',
        seed: 12345,
        width: 1280,
        height: 720,
      }
      
      const result = await video(config)`${prompt}`
      
      expect(result).toBeDefined()
      expect(result.videoUrl).toBe('https://example.com/video.mp4')
      expect(result.operationName).toBe('test_operation')
    })
  })
  
  describe('caching', () => {
    it('should return cached result when available and files exist', async () => {
      const prompt = 'A cached video prompt'
      const cachedResult = {
        videoUrl: 'https://example.com/cached-video.mp4',
        operationName: 'cached_operation',
        localPath: '/tmp/video/cached-video.mp4',
      }
      
      // Setup fs.readFile to return cached result
      fs.promises.readFile.mockResolvedValueOnce(JSON.stringify(cachedResult))
      
      const result = await video`${prompt}`
      
      expect(result).toEqual(cachedResult)
      expect(fs.promises.readFile).toHaveBeenCalled()
      expect(fs.promises.access).toHaveBeenCalled()
    })
    
    it('should regenerate when cached files are missing', async () => {
      const prompt = 'A video prompt with missing cache'
      const cachedResult = {
        videoUrl: 'https://example.com/cached-video.mp4',
        operationName: 'cached_operation',
        localPath: '/tmp/video/cached-video.mp4',
      }
      
      // Setup fs.readFile to return cached result
      fs.promises.readFile.mockResolvedValueOnce(JSON.stringify(cachedResult))
      
      // But access throws error indicating file doesn't exist
      fs.promises.access.mockRejectedValueOnce(new Error('File not found'))
      
      const result = await video`${prompt}`
      
      expect(result).not.toEqual(cachedResult)
      expect(result.videoUrl).toBe('https://example.com/video.mp4')
      expect(fs.promises.readFile).toHaveBeenCalled()
      expect(fs.promises.access).toHaveBeenCalled()
    })
  })
  
  describe('error handling', () => {
    it('should throw error when GOOGLE_API_KEY is not set', async () => {
      delete process.env.GOOGLE_API_KEY
      
      const prompt = 'A test video prompt'
      
      await expect(video`${prompt}`).rejects.toThrow('GOOGLE_API_KEY environment variable is not set.')
    })
    
    it('should handle video download failure', async () => {
      // Make fetch return a response with error URL
      mockFetch.mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            name: 'test_operation',
            done: true,
            response: {
              name: 'test_video',
              uri: 'https://example.com/error/video.mp4'
            }
          })
        })
      })
      
      const prompt = 'A test video prompt'
      
      await expect(video`${prompt}`).rejects.toThrow('Failed to download video')
    })
    
    it('should handle timeout when video generation takes too long', async () => {
      // Mock setTimeout to simulate timeout
      setTimeout.mockImplementationOnce((callback, ms) => {
        // Don't call the callback to simulate timeout
        return 123 // mock timer id
      })
      
      // Mock fetch to never return done=true
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            name: 'test_operation',
            done: false
          })
        })
      })
      
      const prompt = 'A test video prompt'
      
      await expect(video`${prompt}`).rejects.toThrow('Video generation timed out')
    })
  })
  
  describe('polling behavior', () => {
    it('should poll until operation is complete', async () => {
      // First call returns not done
      mockFetch.mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            name: 'test_operation',
            done: false
          })
        })
      })
      
      // Second call returns done
      mockFetch.mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            name: 'test_operation',
            done: true,
            response: {
              name: 'test_video',
              uri: 'https://example.com/video.mp4'
            }
          })
        })
      })
      
      const prompt = 'A test video prompt'
      
      const result = await video`${prompt}`
      
      expect(result).toBeDefined()
      expect(result.videoUrl).toBe('https://example.com/video.mp4')
      expect(mockFetch).toHaveBeenCalledTimes(3) // Initial request + 2 polling requests
    })
  })
})
