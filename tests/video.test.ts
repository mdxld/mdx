import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { video, VideoConfig, VideoResult } from 'mdxai'
import { promises as fs } from 'fs'
import path from 'path'

const testCacheDir = path.join(process.cwd(), '.ai', 'cache')

describe('video e2e', () => {
  // Note: We don't clear the cache as that's the whole point of having it
  // Tests should be designed to work with existing cache or handle cache misses gracefully

  it('should generate a video and cache the result', async () => {
    // Skip test if no API key is available
    if (!process.env.GOOGLE_API_KEY) {
      console.log('Skipping video e2e test: GOOGLE_API_KEY not set')
      return
    }

    const config: VideoConfig = {
      prompt: 'A simple animation of a bouncing ball on a white background',
      maxWaitTimeSeconds: 120, // 2 minutes for e2e test
      pollingIntervalSeconds: 5,
    }

    // First generation - should create new video
    const result1 = await video(config)

    expect(result1.prompt).toBe(config.prompt)
    expect(result1.videoFilePaths).toBeDefined()
    expect(result1.videoFilePaths.length).toBeGreaterThan(0)
    expect(result1.metadata.model).toBe('veo-2.0-generate-001')
    expect(result1.metadata.aspectRatio).toBe('16:9')
    expect(result1.metadata.personGeneration).toBe('allow')
    expect(result1.metadata.generationTimeMs).toBeGreaterThan(0)
    expect(result1.metadata.completedAt).toBeDefined()

    // Verify video files exist
    for (const videoPath of result1.videoFilePaths) {
      const fileExists = await fs.access(videoPath).then(() => true).catch(() => false)
      expect(fileExists).toBe(true)

      // Check file size (should be > 0)
      const stats = await fs.stat(videoPath)
      expect(stats.size).toBeGreaterThan(0)
    }

    // Second generation with same config - should return cached result
    const result2 = await video(config)

    expect(result2.prompt).toBe(result1.prompt)
    expect(result2.videoFilePaths).toEqual(result1.videoFilePaths)
    expect(result2.metadata.completedAt).toBe(result1.metadata.completedAt)

    // Verify cached files still exist
    for (const videoPath of result2.videoFilePaths) {
      const fileExists = await fs.access(videoPath).then(() => true).catch(() => false)
      expect(fileExists).toBe(true)
    }
  }, 180000) // 3 minutes timeout

  it('should generate videos with different configurations', async () => {
    // Skip test if no API key is available
    if (!process.env.GOOGLE_API_KEY) {
      console.log('Skipping video e2e test: GOOGLE_API_KEY not set')
      return
    }

    const config1: VideoConfig = {
      prompt: 'A red circle moving from left to right',
      aspectRatio: '16:9',
      personGeneration: 'dont_allow',
      maxWaitTimeSeconds: 120,
    }

    const config2: VideoConfig = {
      prompt: 'A blue square rotating clockwise',
      aspectRatio: '9:16',
      personGeneration: 'allow',
      maxWaitTimeSeconds: 120,
    }

    const [result1, result2] = await Promise.all([
      video(config1),
      video(config2),
    ])

    // Results should be different
    expect(result1.prompt).toBe(config1.prompt)
    expect(result2.prompt).toBe(config2.prompt)
    expect(result1.videoFilePaths).not.toEqual(result2.videoFilePaths)
    expect(result1.metadata.aspectRatio).toBe('16:9')
    expect(result2.metadata.aspectRatio).toBe('9:16')
    expect(result1.metadata.personGeneration).toBe('dont_allow')
    expect(result2.metadata.personGeneration).toBe('allow')

    // Both should have valid video files
    for (const videoPath of [...result1.videoFilePaths, ...result2.videoFilePaths]) {
      const fileExists = await fs.access(videoPath).then(() => true).catch(() => false)
      expect(fileExists).toBe(true)
    }
  }, 300000) // 5 minutes timeout for parallel generation

  it('should create proper cache directory structure', async () => {
    // Skip test if no API key is available
    if (!process.env.GOOGLE_API_KEY) {
      console.log('Skipping video e2e test: GOOGLE_API_KEY not set')
      return
    }

    const config: VideoConfig = {
      prompt: 'A simple test animation',
      maxWaitTimeSeconds: 120,
    }

    const result = await video(config)

    // Check that cache directory was created
    const cacheExists = await fs.access(testCacheDir).then(() => true).catch(() => false)
    expect(cacheExists).toBe(true)

    // Check that cache metadata file was created
    const cacheFiles = await fs.readdir(testCacheDir)
    const jsonFiles = cacheFiles.filter(file => file.endsWith('.json'))
    expect(jsonFiles.length).toBeGreaterThan(0)

    // Verify cache file content
    const cacheFile = path.join(testCacheDir, jsonFiles[0])
    const cacheContent = JSON.parse(await fs.readFile(cacheFile, 'utf-8'))
    
    expect(cacheContent.prompt).toBe(config.prompt)
    expect(cacheContent.videoFilePaths).toBeDefined()
    expect(cacheContent.metadata).toBeDefined()
    expect(cacheContent.metadata.model).toBe('veo-2.0-generate-001')
  }, 180000)

  it('should handle API errors gracefully', async () => {
    // Test with invalid API key
    const originalKey = process.env.GOOGLE_API_KEY
    process.env.GOOGLE_API_KEY = 'invalid-key'

    const config: VideoConfig = {
      prompt: 'Test prompt',
      maxWaitTimeSeconds: 30,
    }

    try {
      await expect(video(config)).rejects.toThrow()
    } finally {
      // Restore original API key
      if (originalKey) {
        process.env.GOOGLE_API_KEY = originalKey
      } else {
        delete process.env.GOOGLE_API_KEY
      }
    }
  }, 60000)

  it('should handle missing API key', async () => {
    const originalKey = process.env.GOOGLE_API_KEY
    delete process.env.GOOGLE_API_KEY

    const config: VideoConfig = {
      prompt: 'Test prompt',
    }

    try {
      await expect(video(config)).rejects.toThrow('GOOGLE_API_KEY environment variable is not set.')
    } finally {
      // Restore original API key
      if (originalKey) {
        process.env.GOOGLE_API_KEY = originalKey
      }
    }
  })

  it('should handle timeout scenarios', async () => {
    // Skip test if no API key is available
    if (!process.env.GOOGLE_API_KEY) {
      console.log('Skipping video e2e test: GOOGLE_API_KEY not set')
      return
    }

    const config: VideoConfig = {
      prompt: 'A complex animation that might take a while',
      maxWaitTimeSeconds: 1, // Very short timeout to trigger timeout error
      pollingIntervalSeconds: 0.5,
    }

    await expect(video(config)).rejects.toThrow('Video generation timed out after 1 seconds')
  }, 30000)

  it('should cache videos with different prompts separately', async () => {
    // Skip test if no API key is available
    if (!process.env.GOOGLE_API_KEY) {
      console.log('Skipping video e2e test: GOOGLE_API_KEY not set')
      return
    }

    const config1: VideoConfig = {
      prompt: 'A cat walking',
      maxWaitTimeSeconds: 120,
    }

    const config2: VideoConfig = {
      prompt: 'A dog running',
      maxWaitTimeSeconds: 120,
    }

    const result1 = await video(config1)
    const result2 = await video(config2)

    // Should have different cache files and video files
    expect(result1.videoFilePaths).not.toEqual(result2.videoFilePaths)
    expect(result1.prompt).toBe('A cat walking')
    expect(result2.prompt).toBe('A dog running')

    // Check that separate cache files were created
    const cacheFiles = await fs.readdir(testCacheDir)
    const jsonFiles = cacheFiles.filter(file => file.endsWith('.json'))
    expect(jsonFiles.length).toBe(2)

    // Verify both sets of video files exist
    for (const videoPath of [...result1.videoFilePaths, ...result2.videoFilePaths]) {
      const fileExists = await fs.access(videoPath).then(() => true).catch(() => false)
      expect(fileExists).toBe(true)
    }
  }, 300000)

  it('should invalidate cache when video files are missing', async () => {
    // Skip test if no API key is available
    if (!process.env.GOOGLE_API_KEY) {
      console.log('Skipping video e2e test: GOOGLE_API_KEY not set')
      return
    }

    const config: VideoConfig = {
      prompt: 'A simple test for cache invalidation',
      maxWaitTimeSeconds: 120,
    }

    // First generation
    const result1 = await video(config)
    expect(result1.videoFilePaths.length).toBeGreaterThan(0)

    // Delete the video files but keep the cache metadata
    for (const videoPath of result1.videoFilePaths) {
      await fs.unlink(videoPath)
    }

    // Second generation should regenerate the videos
    const result2 = await video(config)
    expect(result2.videoFilePaths.length).toBeGreaterThan(0)

    // Verify new video files exist
    for (const videoPath of result2.videoFilePaths) {
      const fileExists = await fs.access(videoPath).then(() => true).catch(() => false)
      expect(fileExists).toBe(true)
    }
  }, 300000)
}, 600000) // 10 minute timeout for the entire suite 