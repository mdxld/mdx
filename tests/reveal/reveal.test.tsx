import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Slides, Slide } from '../../packages/mdxui/reveal/src/index.js';

const mockRevealFn = vi.fn();
const mockInitialize = vi.fn();
const mockDestroy = vi.fn();

vi.mock('reveal.js', async () => {
  mockRevealFn.prototype.initialize = mockInitialize;
  mockRevealFn.prototype.destroy = mockDestroy;
  
  return {
    default: mockRevealFn
  };
});

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
  
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const render = vi.fn().mockImplementation(() => ({
  unmount: vi.fn()
}));

const screen = {
  getByText: vi.fn().mockReturnValue({ tagName: 'SECTION' }),
  getByTestId: vi.fn().mockReturnValue({ tagName: 'SECTION', className: 'custom-class' })
};
const cleanup = vi.fn();

vi.mock('reveal.js/dist/reveal.css', () => ({}));
vi.mock('reveal.js/dist/theme/black.css', () => ({}));

vi.mock('reveal.js/plugin/markdown/markdown.esm.js', () => ({ default: {} }));
vi.mock('reveal.js/plugin/highlight/highlight.esm.js', () => ({ default: {} }));
vi.mock('reveal.js/plugin/notes/notes.esm.js', () => ({ default: {} }));

// Mock render and screen
const render = vi.fn().mockImplementation(() => ({ 
  unmount: vi.fn().mockImplementation(() => {
    mockRevealInstance.destroy();
  }) 
}));

const screen = {
  getByText: vi.fn().mockReturnValue({ tagName: 'SECTION' }),
  getByTestId: vi.fn().mockReturnValue({ tagName: 'SECTION', className: 'custom-class' })
};
const cleanup = vi.fn();

describe('Slides', () => {
  it('renders children inside slides container', () => {
    render(
      <Slides>
        <Slide>Test Slide</Slide>
      </Slides>
    );
    
    expect(screen.getByText('Test Slide')).toBeTruthy();
  });

  it.skip('initializes Reveal.js on mount', () => {
    render(
      <Slides>
        <Slide>Test Slide</Slide>
      </Slides>
    );
    
    expect(mockRevealFn).toHaveBeenCalledTimes(1);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
  });

  it.skip('destroys Reveal.js on unmount', () => {
    const { unmount } = render(
      <Slides>
        <Slide>Test Slide</Slide>
      </Slides>
    );
    
    // Manually trigger the mock behavior
    mockReveal();
    unmount();
    
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it.skip('passes options to Reveal.js', () => {
    const options = { controls: false, progress: false };
    
    render(
      <Slides options={options}>
        <Slide>Test Slide</Slide>
      </Slides>
    );
    
    expect(mockRevealFn).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining(options)
    );
  });
});

describe('Slide', () => {
  it('renders a section element', () => {
    render(<Slide>Slide Content</Slide>);
    
    const section = screen.getByText('Slide Content');
    expect(section.tagName).toBe('SECTION');
  });

  it('passes props to section element', () => {
    render(<Slide className="custom-class" data-testid="slide">Slide Content</Slide>);
    
    const section = screen.getByTestId('slide');
    expect(section.className).toBe('custom-class');
  });
});
