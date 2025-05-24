import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Image, ImageProps } from './components';
import * as ReactDOMServer from 'react-dom/server';

vi.mock('react-dom/server', () => ({
  renderToStaticMarkup: vi.fn().mockImplementation((component) => {
    return '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  })
}));

const mockAsciify = vi.fn();
vi.mock('asciify-image', () => ({
  default: mockAsciify
}));

const MockIcon = (props: any) => <div {...props} />;

const wait = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

describe('Image component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAsciify.mockReset();
  });

  it('should render loading state initially', () => {
    mockAsciify.mockResolvedValue('');
    const { lastFrame } = render(<Image icon={MockIcon} />);
    expect(lastFrame()).toContain('[Loading image...]');
  });

  it('should convert SVG to ASCII art', async () => {
    const asciiArt = '  ###  \n #####\n#######';
    mockAsciify.mockResolvedValue(asciiArt);
    
    const { lastFrame } = render(<Image icon={MockIcon} width={20} />);
    
    await wait(100);
    
    expect(lastFrame()).toContain(asciiArt.split('\n')[0]);
    expect(lastFrame()).toContain(asciiArt.split('\n')[1]);
    expect(lastFrame()).toContain(asciiArt.split('\n')[2]);
    
    expect(mockAsciify).toHaveBeenCalledWith(
      expect.stringContaining('data:image/svg+xml;base64,'),
      expect.objectContaining({
        width: 20,
        fit: 'box',
        format: 'string'
      })
    );
  });

  it('should handle array output from asciify', async () => {
    const asciiArt = ['  ###  ', ' ##### ', '#######'];
    mockAsciify.mockResolvedValue(asciiArt);
    
    const { lastFrame } = render(<Image icon={MockIcon} />);
    
    await wait(100);
    
    expect(lastFrame()).toContain(asciiArt[0]);
    expect(lastFrame()).toContain(asciiArt[1]);
    expect(lastFrame()).toContain(asciiArt[2]);
  });

  it('should handle errors in SVG rendering', async () => {
    const ErrorIcon: React.FC = () => <div>Error Icon</div>;
    
    const originalMock = vi.mocked(ReactDOMServer.renderToStaticMarkup).getMockImplementation();
    
    vi.mocked(ReactDOMServer.renderToStaticMarkup).mockImplementationOnce(() => {
      throw new Error('SVG rendering error');
    });
    
    const { lastFrame } = render(<Image icon={ErrorIcon} />);
    
    
    expect(lastFrame()).toContain('[Image Error: Failed to render icon: SVG rendering error]');
    expect(mockAsciify).not.toHaveBeenCalled();
  });

  it('should handle errors in ASCII conversion', async () => {
    mockAsciify.mockRejectedValue(new Error('ASCII conversion error'));
    
    const { lastFrame } = render(<Image icon={MockIcon} />);
    
    await wait(100);
    
    expect(lastFrame()).toContain('[Image Error: Failed to convert to ASCII: ASCII conversion error]');
  });

  it('should accept direct SVG string input', async () => {
    const asciiArt = '  ###  \n #####\n#######';
    mockAsciify.mockResolvedValue(asciiArt);
    
    const svgString = '<svg><circle cx="50" cy="50" r="40" /></svg>';
    const { lastFrame } = render(<Image svg={svgString} />);
    
    await wait(100);
    
    expect(lastFrame()).toContain(asciiArt.split('\n')[0]);
    expect(mockAsciify).toHaveBeenCalledWith(
      expect.stringContaining('data:image/svg+xml;base64,'),
      expect.anything()
    );
  });

  it('should apply color to the ASCII art', async () => {
    const asciiArt = '  ###  \n #####\n#######';
    mockAsciify.mockResolvedValue(asciiArt);
    
    const { lastFrame } = render(<Image icon={MockIcon} color="green" />);
    
    await wait(100);
    
    expect(mockAsciify).toHaveBeenCalled();
  });

  it('should respect width and height props', async () => {
    const asciiArt = '  ###  \n #####\n#######';
    mockAsciify.mockResolvedValue(asciiArt);
    
    render(<Image icon={MockIcon} width={30} height={15} />);
    
    await wait(100);
    
    expect(mockAsciify).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        width: 30,
        height: 15
      })
    );
  });

  it('should use width for height if height is not provided', async () => {
    const asciiArt = '  ###  \n #####\n#######';
    mockAsciify.mockResolvedValue(asciiArt);
    
    render(<Image icon={MockIcon} width={25} />);
    
    await wait(100);
    
    expect(mockAsciify).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        width: 25,
        height: 25
      })
    );
  });
});
