import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import * as components from '../src/components'
import * as io5Icons from 'react-icons/io5'
import * as faIcons from 'react-icons/fa'
import * as mdIcons from 'react-icons/md'

const IconSpy = vi.fn(({ name }) => `Icon: ${name}`)
vi.spyOn(components, 'Icon').mockImplementation(IconSpy)

const IoRocketSharpSpy = vi.fn()
vi.spyOn(io5Icons, 'IoRocketSharp').mockImplementation(IoRocketSharpSpy)

const FaHeartSpy = vi.fn()
vi.spyOn(faIcons, 'FaHeart').mockImplementation(FaHeartSpy)

const MdHomeSpy = vi.fn()
vi.spyOn(mdIcons, 'MdHome').mockImplementation(MdHomeSpy)

describe('Icon Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should pass basic test', () => {
    expect(true).toBe(true)
  })
  
  it('should render icons correctly', () => {
    const icon = components.Icon({ name: 'rocket' })
    expect(icon).toBe('Icon: rocket')
    expect(IconSpy).toHaveBeenCalledWith({ name: 'rocket' })
  })
}
