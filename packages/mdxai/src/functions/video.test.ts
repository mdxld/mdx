import 'dotenv/config'
import { describe, expect, it } from 'vitest'
import { video } from './video'

describe('video function', () => {
  const testPrompt = 'of a pelican riding a bicycle'
  
  it('should generate video with tagged template literal', async () => {
    const result = await video`${testPrompt}`
    expect(result).toBeDefined()
    expect(result.videoFilePaths).toBeDefined()
    expect(result.prompt).toBe(testPrompt)
    expect(result.metadata).toBeDefined()
  })

  it('should generate video with tagged template literal and options', async () => {
    const result = await video`${testPrompt}`({ aspectRatio: '9:16' })
    expect(result).toBeDefined()
    expect(result.videoFilePaths).toBeDefined()
    expect(result.prompt).toBe(testPrompt)
    expect(result.metadata.aspectRatio).toBe('9:16')
  })

  it('should generate video as a simple function', async () => {
    const result = await video(testPrompt)
    expect(result).toBeDefined()
    expect(result.videoFilePaths).toBeDefined()
    expect(result.prompt).toBe(testPrompt)
  })

  it('should generate video as a simple function with options', async () => {
    const result = await video(testPrompt, { aspectRatio: '1:1', model: 'veo-2.0-generate-001' })
    expect(result).toBeDefined()
    expect(result.videoFilePaths).toBeDefined()
    expect(result.prompt).toBe(testPrompt)
    expect(result.metadata.aspectRatio).toBe('1:1')
  })

  it('should maintain backward compatibility with VideoConfig', async () => {
    const config = {
      prompt: testPrompt,
      aspectRatio: '4:3' as '4:3',
      model: 'veo-2.0-generate-001'
    }
    const result = await video(config.prompt, config)
    expect(result).toBeDefined()
    expect(result.prompt).toBe(testPrompt)
    expect(result.metadata.aspectRatio).toBe('4:3')
  })
})
  
