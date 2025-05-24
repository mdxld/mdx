import { describe, it, expect, vi } from 'vitest';
import { compileMdx } from './render';
import React from 'react';

vi.mock('react', () => ({
  createElement: vi.fn(),
  isValidElement: vi.fn().mockReturnValue(true),
  cloneElement: vi.fn()
}));

vi.mock('ink', () => ({
  render: vi.fn().mockReturnValue({ waitUntilExit: vi.fn().mockResolvedValue(undefined) })
}));

describe('compileMdx', () => {
  it('should handle MDX content with export default', async () => {
    const mdxContent = `
      export default function Test({ name }) {
        return <div>Hello {name}</div>;
      }
    `;
    
    const Component = await compileMdx(mdxContent, { name: 'World' });
    expect(Component).toBeDefined();
  });
  
  it('should handle errors gracefully', async () => {
    const mdxContent = `
      This is invalid MDX content
      export default function Test({ name }) {
        return <div>Hello {name}</div
      }
    `;
    
    const Component = await compileMdx(mdxContent, { name: 'World' });
    expect(Component).toBeDefined();
  });
});
