import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { video } from './video'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Mock fs module
vi.mock('fs', () => {
  const mockReadFile = vi.fn()
  const mockWriteFile = vi.fn()
  const mockAccess = vi.fn()
  const mockMkdir = vi.fn()
  
  return {
    promises: {
      readFile: mockReadFile,
      writeFile: mockWriteFile,
      access: mockAccess,
      mkdir: mockMkdir,
    },
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
    mkdir: vi.fn(),
    existsSync: vi.fn(),
    createReadStream: vi.fn(),
    createWriteStream: vi.fn(),
  }
})

// Mock fetch
vi.mock('node-fetch', () => {
  return {
    default: vi.fn().mockImplementation((url) => {
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
  }
})

// Mock setTimeout
vi.mock('timers', () => {
  return {
    setTimeout: vi.fn().mockImplementation((callback, ms) => {
      callback()
      return 123 // mock timer id
    }),
    clearTimeout: vi.fn()
  }
})

describe('video function', () => {
  const originalEnv = { ...process.env }
  
  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'mock-google-api-key'
    vi.clearAllMocks()
    
    // Setup fs mocks
    const mockFs = require('fs').promises
    
    // Default behavior for access - file exists
    mockFs.access.mockImplementation(() => Promise.resolve())
    
    // Default behavior for mkdir - success
    mockFs.mkdir.mockImplementation(() => Promise.resolve())
    
    // Default behavior for writeFile - success
    mockFs.writeFile.mockImplementation(() => Promise.resolve())
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
      const mockFs = require('fs').promises
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(cachedResult))
      
      const result = await video`${prompt}`
      
      expect(result).toEqual(cachedResult)
      expect(mockFs.readFile).toHaveBeenCalled()
      expect(mockFs.access).toHaveBeenCalled()
    })
    
    it('should regenerate when cached files are missing', async () => {
      const prompt = 'A video prompt with missing cache'
      const cachedResult = {
        videoUrl: 'https://example.com/cached-video.mp4',
        operationName: 'cached_operation',
        localPath: '/tmp/video/cached-video.mp4',
      }
      
      // Setup fs.readFile to return cached result
      const mockFs = require('fs').promises
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(cachedResult))
      
      // But access throws error indicating file doesn't exist
      mockFs.access.mockRejectedValueOnce(new Error('File not found'))
      
      const result = await video`${prompt}`
      
      expect(result).not.toEqual(cachedResult)
      expect(result.videoUrl).toBe('https://example.com/video.mp4')
      expect(mockFs.readFile).toHaveBeenCalled()
      expect(mockFs.access).toHaveBeenCalled()
    })
  })
  
  describe('error handling', () => {
    it('should throw error when GOOGLE_API_KEY is not set', async () => {
      delete process.env.GOOGLE_API_KEY
      
      const prompt = 'A test video prompt'
      
      await expect(video`${prompt}`).rejects.toThrow('GOOGLE_API_KEY is required')
    })
    
    it('should handle video download failure', async () => {
      const fetch = require('node-fetch').default
      
      // Make fetch return a response with error URL
      fetch.mockImplementationOnce(() => {
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
      const { setTimeout } = require('timers')
      setTimeout.mockImplementationOnce((callback, ms) => {
        // Don't call the callback to simulate timeout
        return 123 // mock timer id
      })
      
      // Mock fetch to never return done=true
      const fetch = require('node-fetch').default
      fetch.mockImplementation(() => {
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
      const fetch = require('node-fetch').default
      
      // First call returns not done
      fetch.mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            name: 'test_operation',
            done: false
          })
        })
      })
      
      // Second call returns done
      fetch.mockImplementationOnce(() => {
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
      expect(fetch).toHaveBeenCalledTimes(3) // Initial request + 2 polling requests
    })
  })
})
