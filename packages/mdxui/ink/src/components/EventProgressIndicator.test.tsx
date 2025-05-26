import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { EventProgressIndicator } from './EventProgressIndicator';

describe('EventProgressIndicator', () => {
  it('renders a progress bar with 0% progress', () => {
    const { lastFrame } = render(<EventProgressIndicator current={0} total={10} /> as any);
    const output = lastFrame();
    
    expect(output).toContain('0%');
    expect(output).toContain('[');
    expect(output).toContain(']');
  });

  it('renders a progress bar with 50% progress', () => {
    const { lastFrame } = render(<EventProgressIndicator current={5} total={10} /> as any);
    const output = lastFrame();
    
    expect(output).toContain('50%');
  });

  it('renders a progress bar with 100% progress', () => {
    const { lastFrame } = render(<EventProgressIndicator current={10} total={10} /> as any);
    const output = lastFrame();
    
    expect(output).toContain('100%');
  });

  it('handles progress greater than 100%', () => {
    const { lastFrame } = render(<EventProgressIndicator current={15} total={10} /> as any);
    const output = lastFrame();
    
    expect(output).toContain('100%');
  });

  it('handles custom width', () => {
    const { lastFrame } = render(<EventProgressIndicator current={5} total={10} width={20} /> as any);
    const output = lastFrame();
    
    expect(output).toContain('50%');
  });
});
