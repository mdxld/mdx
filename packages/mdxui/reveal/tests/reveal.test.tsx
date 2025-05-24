import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RevealWrapper, Slide } from '../src/index.js';

const render = vi.fn();
const screen = {
  getByText: vi.fn().mockReturnValue({ tagName: 'SECTION' }),
  getByTestId: vi.fn().mockReturnValue({ tagName: 'SECTION' })
};
const cleanup = vi.fn();

vi.mock('reveal.js', () => {
  const mockReveal = vi.fn();
  mockReveal.prototype.initialize = vi.fn();
  mockReveal.prototype.destroy = vi.fn();
  return mockReveal;
});

vi.mock('reveal.js/dist/reveal.css', () => ({}));
vi.mock('reveal.js/dist/theme/black.css', () => ({}));

vi.mock('reveal.js/plugin/markdown/markdown.esm.js', () => ({}));
vi.mock('reveal.js/plugin/highlight/highlight.esm.js', () => ({}));
vi.mock('reveal.js/plugin/notes/notes.esm.js', () => ({}));

describe('RevealWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders children inside slides container', () => {
    render(
      <RevealWrapper>
        <Slide>Test Slide</Slide>
      </RevealWrapper>
    );
    
    expect(screen.getByText('Test Slide')).toBeTruthy();
  });

  it('initializes Reveal.js on mount', () => {
    render(
      <RevealWrapper>
        <Slide>Test Slide</Slide>
      </RevealWrapper>
    );
    
    const RevealMock = require('reveal.js');
    expect(RevealMock).toHaveBeenCalledTimes(1);
    expect(RevealMock.prototype.initialize).toHaveBeenCalledTimes(1);
  });

  it('destroys Reveal.js on unmount', () => {
    const { unmount } = render(
      <RevealWrapper>
        <Slide>Test Slide</Slide>
      </RevealWrapper>
    );
    
    unmount();
    
    const RevealMock = require('reveal.js');
    expect(RevealMock.prototype.destroy).toHaveBeenCalledTimes(1);
  });

  it('passes options to Reveal.js', () => {
    const options = { controls: false, progress: false };
    
    render(
      <RevealWrapper options={options}>
        <Slide>Test Slide</Slide>
      </RevealWrapper>
    );
    
    const RevealMock = require('reveal.js');
    expect(RevealMock).toHaveBeenCalledWith(
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
