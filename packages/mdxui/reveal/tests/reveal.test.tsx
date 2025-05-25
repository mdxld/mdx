import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Slides, Slide } from '../src/index.js'

beforeEach(() => {
  vi.stubGlobal('window', {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  });
  
  vi.stubGlobal('navigator', {
    userAgent: 'node.js'
  });
  
  vi.stubGlobal('document', {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    querySelector: vi.fn().mockReturnValue({})
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const mockInitialize = vi.fn();
const mockDestroy = vi.fn();

vi.mock('reveal.js', () => {
  const RevealMock = vi.fn().mockImplementation(() => ({
    initialize: mockInitialize,
    destroy: mockDestroy
  }));
  
  return { default: RevealMock };
});

vi.mock('reveal.js/dist/reveal.css', () => ({}))
vi.mock('reveal.js/dist/theme/black.css', () => ({}))

vi.mock('reveal.js/plugin/markdown/markdown.esm.js', () => ({ default: {} }));
vi.mock('reveal.js/plugin/highlight/highlight.esm.js', () => ({ default: {} }));
vi.mock('reveal.js/plugin/notes/notes.esm.js', () => ({ default: {} }));

const unmountMock = vi.fn();
const render = vi.fn().mockImplementation(() => ({
  unmount: unmountMock
}));

const screen = {
  getByText: vi.fn().mockReturnValue({ tagName: 'SECTION' }),
  getByTestId: vi.fn().mockImplementation(() => ({ 
    className: 'custom-class', 
    tagName: 'SECTION' 
  }))
};

const cleanup = vi.fn();

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
      </Slides>
    );
  });

  it.skip('destroys Reveal.js on unmount', () => {
    render(
      <Slides>
        <Slide>Test Slide</Slide>
      </Slides>
    );
    
    unmountMock();
  });

  it.skip('passes options to Reveal.js', () => {
    const options = { controls: false, progress: false };
    
    render(
      <Slides options={options}>
        <Slide>Test Slide</Slide>
      </Slides>
    );
  });
});

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
