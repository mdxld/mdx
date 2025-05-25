import { describe, it, expect, vi } from 'vitest';
import { toTitleCase, mdxePlugin } from './index';

vi.mock('node:fs', () => ({
  default: {
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue('---\ntitle: Test\n---\n# Hello'),
    existsSync: vi.fn().mockReturnValue(true),
    unlinkSync: vi.fn(),
  },
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn().mockReturnValue('---\ntitle: Test\n---\n# Hello'),
  existsSync: vi.fn().mockReturnValue(true),
  unlinkSync: vi.fn(),
}));

vi.mock('esbuild', () => ({
  build: vi.fn().mockResolvedValue({}),
  context: vi.fn().mockResolvedValue({
    watch: vi.fn().mockResolvedValue({}),
  }),
}));

vi.mock('fast-glob', () => ({
  default: vi.fn().mockResolvedValue(['test.mdx']),
  sync: vi.fn().mockReturnValue(['test.mdx']),
}));

describe('@mdxe/esbuild', () => {
  describe('toTitleCase', () => {
    it('converts file paths to TitleCase', () => {
      expect(toTitleCase('hello-world.mdx')).toBe('HelloWorld');
      expect(toTitleCase('path/to/my-file.md')).toBe('PathToMyFile');
      expect(toTitleCase('kebab-case-example.mdx')).toBe('KebabCaseExample');
    });
  });
  
  describe('mdxePlugin', () => {
    it('creates a valid esbuild plugin', () => {
      const plugin = mdxePlugin();
      
      expect(plugin.name).toBe('mdxe');
      expect(typeof plugin.setup).toBe('function');
    });
  });
});
