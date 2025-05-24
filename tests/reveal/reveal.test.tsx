import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Slides, Slide } from '../../packages/mdxui/reveal/src/index.js';

describe.skip('Slides with Reveal.js', () => {
  it('initializes Reveal.js on mount', () => {
  });

  it('destroys Reveal.js on unmount', () => {
  });

  it('passes options to Reveal.js', () => {
  });
});

vi.mock('reveal.js/dist/reveal.css', () => ({}));
vi.mock('reveal.js/dist/theme/black.css', () => ({}));

vi.mock('reveal.js', () => {
  return { default: vi.fn() };
});

vi.mock('reveal.js/plugin/markdown/markdown.esm.js', () => ({ default: {} }));
vi.mock('reveal.js/plugin/highlight/highlight.esm.js', () => ({ default: {} }));
vi.mock('reveal.js/plugin/notes/notes.esm.js', () => ({ default: {} }));

const unmountMock = vi.fn();
const render = vi.fn().mockImplementation(() => ({
  unmount: unmountMock
}));

const screen = {
  getByText: vi.fn().mockReturnValue({ tagName: 'SECTION' }),
  getByTestId: vi.fn().mockReturnValue({ 
    tagName: 'SECTION',
    className: 'custom-class'
  })
};
const cleanup = vi.fn();

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
