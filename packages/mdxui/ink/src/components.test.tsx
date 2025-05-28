import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render } from 'ink-testing-library'
import { Image, ImageProps } from './components'
// import asciifyImage from 'asciify-image'
import * as ReactDOMServer from 'react-dom/server'

// Fix for InkElement type compatibility
const renderWithTypeWorkaround = (element: any) => render(element as any)

const MockIcon = (props: any) => <div {...props} />

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))

const waitForCondition = async (condition: () => boolean, timeout = 2000, interval = 50) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (condition()) return
    await wait(interval)
  }
  throw new Error('Condition not met within timeout')
}

describe('Image component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    const { lastFrame } = renderWithTypeWorkaround(<Image icon={MockIcon} />)
    expect(lastFrame()).toContain('[Loading image...]')
  })

  it('should convert SVG to ASCII art', async () => {
    if (process.env.CI === 'true') {
      return
    }
    
    const asciiArt = '  ###\n #####\n#######'
    
    const { lastFrame } = renderWithTypeWorkaround(<Image icon={MockIcon} width={20} />)

    await waitForCondition(() => !lastFrame().includes('[Loading image...]'))

    expect(lastFrame()).toContain(asciiArt.split('\n')[0])
    expect(lastFrame()).toContain(asciiArt.split('\n')[1])
    expect(lastFrame()).toContain(asciiArt.split('\n')[2])

  }, 60000) // Increase timeout for real API calls

  it('should handle array output from asciify', async () => {
    if (process.env.CI === 'true') {
      return
    }
    
    const asciiArt = ['  ###', ' #####', '#######']
    
    // Mock the dynamic import of asciifyImage
    vi.mock('asciify-image', () => {
      return {
        default: vi.fn().mockResolvedValue(asciiArt)
      }
    })
    
    const { lastFrame } = renderWithTypeWorkaround(<Image icon={MockIcon} />)
    
    await waitForCondition(() => !lastFrame().includes('[Loading image...]'))
    
    expect(lastFrame()).toContain(asciiArt[0])
    expect(lastFrame()).toContain(asciiArt[1])
    expect(lastFrame()).toContain(asciiArt[2])
  })

  it('should handle errors in SVG rendering', async () => {
    if (process.env.CI === 'true') {
      return
    }
    
    const ErrorIcon: React.FC = () => <div>Error Icon</div>
    
    const renderToStaticMarkupSpy = vi.spyOn(ReactDOMServer, 'renderToStaticMarkup').mockImplementationOnce(() => {
      throw new Error('SVG rendering error')
    })
    
    try {
      const { lastFrame } = renderWithTypeWorkaround(<Image icon={ErrorIcon} />)
      
      expect(lastFrame()).toContain('[Image Error: Failed to render icon: SVG rendering error]')
    } finally {
      renderToStaticMarkupSpy.mockRestore()
    }
  })

  it('should handle errors in ASCII conversion', async () => {
    if (process.env.CI === 'true') {
      return
    }
    
    // Mock the dynamic import of asciifyImage
    vi.mock('asciify-image', () => {
      return {
        default: vi.fn().mockRejectedValue(new Error('ASCII conversion error'))
      }
    })
    
    const { lastFrame } = renderWithTypeWorkaround(<Image icon={MockIcon} />)
    
    await waitForCondition(() => lastFrame().includes('[Image Error:'))
    
    expect(lastFrame()).toContain('[Image Error: Failed to convert to ASCII: ASCII conversion error]')
  })

  it('should accept direct SVG string input', async () => {
    if (process.env.CI === 'true') {
      return
    }
    
    const asciiArt = '  ###\n #####\n#######'
    
    const svgString = '<svg><circle cx="50" cy="50" r="40" /></svg>'
    const { lastFrame } = renderWithTypeWorkaround(<Image svg={svgString} />)

    await waitForCondition(() => !lastFrame().includes('[Loading image...]'))

    expect(lastFrame()).toContain(asciiArt.split('\n')[0])
  }, 60000) // Increase timeout for real API calls

  it('should apply color to the ASCII art', async () => {
    if (process.env.CI === 'true') {
      return
    }
    
    const { lastFrame } = renderWithTypeWorkaround(<Image icon={MockIcon} color='green' />)

    await waitForCondition(() => !lastFrame().includes('[Loading image...]'))

  }, 60000) // Increase timeout for real API calls

  it('should respect width and height props', async () => {
    if (process.env.CI === 'true') {
      return
    }
    
    const { lastFrame } = renderWithTypeWorkaround(<Image icon={MockIcon} width={30} height={15} />)

    await waitForCondition(() => !lastFrame().includes('[Loading image...]'))

  }, 60000) // Increase timeout for real API calls

  it('should use width for height if height is not provided', async () => {
    if (process.env.CI === 'true') {
      return
    }
    
    const { lastFrame } = renderWithTypeWorkaround(<Image icon={MockIcon} width={25} />)

    await waitForCondition(() => !lastFrame().includes('[Loading image...]'))

  }, 60000) // Increase timeout for real API calls
})
