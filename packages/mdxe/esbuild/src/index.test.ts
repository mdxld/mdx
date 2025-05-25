import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { 
  toTitleCase, 
  generateIndexSource, 
  buildMdxContent,
  mdxePlugin
} from './index';

vi.mock('node:fs', () => ({
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
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
}));

describe('@mdxe/esbuild', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readFileSync).mockReturnValue('---\ntitle: Test\n---\n# Hello');
    vi.mocked(fs.existsSync).mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('toTitleCase', () => {
    it('converts file paths to TitleCase', () => {
      expect(toTitleCase('hello-world.mdx')).toBe('HelloWorld');
      expect(toTitleCase('path/to/my-file.md')).toBe('PathToMyFile');
      expect(toTitleCase('kebab-case-example.mdx')).toBe('KebabCaseExample');
    });
  });

  describe('generateIndexSource', () => {
    it('generates correct index source code', () => {
      const contentDir = '/content';
      const entries = ['hello.mdx', 'about/me.mdx'];
      
      const source = generateIndexSource(contentDir, entries);
      
      expect(source).toContain('import * as mod0 from');
      expect(source).toContain('import * as mod1 from');
      expect(source).toContain('Hello: { ...mod0, markdown:');
      expect(source).toContain('AboutMe: { ...mod1, markdown:');
    });
  });

  describe('buildMdxContent', () => {
    it('builds MDX content with default options', async () => {
      await buildMdxContent();
      
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(esbuild.build).toHaveBeenCalled();
    });
    
    it('handles watch mode correctly', async () => {
      await buildMdxContent({ watch: true });
      
      expect(esbuild.context).toHaveBeenCalled();
      const contextMock = await vi.mocked(esbuild.context).mock.results[0].value;
      expect(contextMock.watch).toHaveBeenCalled();
    });
    
    it('cleans up temp files in non-watch mode', async () => {
      await buildMdxContent({ watch: false });
      
      expect(fs.unlinkSync).toHaveBeenCalled();
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
