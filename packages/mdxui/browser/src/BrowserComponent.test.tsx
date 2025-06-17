import { describe, it, expect } from 'vitest'
import { BrowserComponent } from './BrowserComponent.js'

describe('BrowserComponent', () => {
  it('should export BrowserComponent', () => {
    expect(BrowserComponent).toBeDefined()
    expect(typeof BrowserComponent).toBe('function')
  })

  it('should have correct component name', () => {
    expect(BrowserComponent.name).toBe('BrowserComponent')
  })
})
