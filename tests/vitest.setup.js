import { vi } from 'vitest';

global.navigator = { userAgent: 'node.js' };

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
