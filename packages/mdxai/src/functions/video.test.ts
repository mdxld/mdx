import { describe, expect, it } from 'vitest'
import { video } from './video'

describe('video function', () => {

  it.skip('should validate configuration', async () => {
    const prompt = 'A test video prompt'
    
    try {
      await video({ prompt })
    } catch (error) {
      expect((error as Error).message).toMatch(/API key|GOOGLE_API_KEY|Bad Request|Not Found/)
    }
  })
  
  it.skip('should validate custom configuration options', async () => {
    const prompt = 'A test video prompt'
    const config = {
      prompt,
      model: 'custom-model',
      aspectRatio: '9:16' as '9:16',
    }
    
    try {
      await video(config)
    } catch (error) {
      expect((error as Error).message).toMatch(/API key|GOOGLE_API_KEY|Bad Request|Not Found/)
    }
  })

})
  
