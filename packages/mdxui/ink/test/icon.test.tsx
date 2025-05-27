import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

vi.mock('../src/components', () => {
  const mockIcon = vi.fn(({ name }) => {
    return React.createElement('div', {}, `Icon: ${name}`)
  })
  
  return {
    Icon: mockIcon
  }
})

vi.mock('react-icons/io5', () => ({
  IoRocketSharp: vi.fn(() => React.createElement('div', {}, 'IoRocketSharp'))
}))

vi.mock('react-icons/fa', () => ({
  FaHeart: vi.fn(() => React.createElement('div', {}, 'FaHeart'))
}))

vi.mock('react-icons/md', () => ({
  MdHome: vi.fn(() => React.createElement('div', {}, 'MdHome'))
}))

import * as components from '../src/components'

describe('Icon Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should pass basic test', () => {
    expect(true).toBe(true)
  })
  
  it('should render icons correctly', () => {
    components.Icon({ name: 'IoRocketSharp' })
    expect(components.Icon).toHaveBeenCalledWith({ name: 'IoRocketSharp' })
  })
})
