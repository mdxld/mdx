import { describe, expect, it } from 'vitest'
import { video } from './video'

describe('video function', () => {

  it.skip('should validate configuration', async () => {
    const prompt = 'A test video prompt'
    await video({ prompt })
  })
  
  it.skip('should validate custom configuration options', async () => {
    const prompt = 'A test video prompt'
    const config = {
      prompt,
      model: 'custom-model',
      aspectRatio: '9:16' as '9:16',
    }
    
    await video(config)
  })

})
  
