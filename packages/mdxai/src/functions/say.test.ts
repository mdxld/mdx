import 'dotenv/config'
import { describe, expect, it } from 'vitest'
import { say } from './say'

describe('say', () => {
  it('should be defined', async () => {
    expect(say).toBeDefined()
  })
})
