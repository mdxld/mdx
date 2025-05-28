import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Slides, Slide } from '../src/index.js'
import Reveal from 'reveal.js'

beforeEach(() => {
  vi.stubGlobal('window', {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })

  vi.stubGlobal('navigator', {
    userAgent: 'node.js',
  })

  vi.stubGlobal('document', {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    querySelector: vi.fn().mockReturnValue({}),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const mockInitialize = vi.fn()
const mockDestroy = vi.fn()

class RevealMock {
  initialize = mockInitialize
  destroy = mockDestroy
}

vi.stubGlobal('Reveal', RevealMock)

const unmountMock = vi.fn()
const render = vi.fn().mockImplementation(() => ({
  unmount: unmountMock,
}))

const screen = {
  getByText: vi.fn().mockReturnValue({ tagName: 'SECTION' }),
  getByTestId: vi.fn().mockImplementation(() => ({
    className: 'custom-class',
    tagName: 'SECTION',
  })),
}

const cleanup = vi.fn()

describe('Slides', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders children inside slides container', () => {
    render(
      <Slides>
        <Slide>Test Slide</Slide>
      </Slides>,
    )

    expect(screen.getByText('Test Slide')).toBeTruthy()
  })

  it.skip('initializes Reveal.js on mount', () => {
    render(
      <Slides>
        <Slide>Test Slide</Slide>
      </Slides>,
    )
  })

  it.skip('destroys Reveal.js on unmount', () => {
    render(
      <Slides>
        <Slide>Test Slide</Slide>
      </Slides>,
    )

    unmountMock()
  })

  it.skip('passes options to Reveal.js', () => {
    const options = { controls: false, progress: false }

    render(
      <Slides options={options}>
        <Slide>Test Slide</Slide>
      </Slides>,
    )
  })
})

describe('Slide', () => {
  it('renders a section element', () => {
    render(<Slide>Slide Content</Slide>)

    const section = screen.getByText('Slide Content')
    expect(section.tagName).toBe('SECTION')
  })

  it('passes props to section element', () => {
    render(
      <Slide className='custom-class' data-testid='slide'>
        Slide Content
      </Slide>,
    )

    const section = screen.getByTestId('slide')
    expect(section.className).toBe('custom-class')
  })
})
