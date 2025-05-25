import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Slides, Slide } from '../../packages/mdxui/reveal/src/index.js';

vi.mock('reveal.js/js/utils/device.js', () => ({
  default: { 
    isAndroid: false,
    isIOS: false,
    isMobile: false
  }
}));

global.document = {
  createElement: vi.fn().mockReturnValue({
    classList: { add: vi.fn() },
    style: {},
    appendChild: vi.fn()
  })
} as any;

const render = vi.fn().mockReturnValue({ unmount: vi.fn() });
const screen = {
  getByText: vi.fn().mockReturnValue({ tagName: 'SECTION' }),
  getByTestId: vi.fn().mockReturnValue({ tagName: 'SECTION', className: 'custom-class' })
};
const cleanup = vi.fn();

const mockRevealInstance = {
  initialize: vi.fn(),
  destroy: vi.fn()
};
const mockReveal = vi.fn().mockImplementation(() => mockRevealInstance);
vi.mock('reveal.js', () => mockReveal);

vi.mock('reveal.js/dist/reveal.css', () => ({}));
vi.mock('reveal.js/dist/theme/black.css', () => ({}));

vi.mock('reveal.js/plugin/markdown/markdown.esm.js', () => ({}));
vi.mock('reveal.js/plugin/highlight/highlight.esm.js', () => ({}));
vi.mock('reveal.js/plugin/notes/notes.esm.js', () => ({}));

describe('Slides', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders children inside slides container', () => {
    render(
      <Slides>
        <Slide>Test Slide</Slide>
      </Slides>
    );
    
    expect(screen.getByText('Test Slide')).toBeTruthy();
  });

  it('initializes Reveal.js on mount', () => {
    render(
      <Slides>
        <Slide>Test Slide</Slide>
      </Slides>
    );
    
    expect(mockReveal).toHaveBeenCalledTimes(1);
    expect(mockRevealInstance.initialize).toHaveBeenCalledTimes(1);
  });

  it('destroys Reveal.js on unmount', () => {
    const { unmount } = render(
      <Slides>
        <Slide>Test Slide</Slide>
      </Slides>
    );
    
    unmount();
    
    expect(mockRevealInstance.destroy).toHaveBeenCalledTimes(1);
  });

  it('passes options to Reveal.js', () => {
    const options = { controls: false, progress: false };
    
    render(
      <Slides options={options}>
        <Slide>Test Slide</Slide>
      </Slides>
    );
    
    expect(mockReveal).toHaveBeenCalledWith(
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
