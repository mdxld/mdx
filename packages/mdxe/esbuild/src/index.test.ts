import { describe, it, expect, vi } from 'vitest';
import { toTitleCase } from './index';

describe('@mdxe/esbuild', () => {
  describe('toTitleCase', () => {
    it('converts file paths to TitleCase', () => {
      expect(toTitleCase('hello-world.mdx')).toBe('HelloWorld');
      expect(toTitleCase('path/to/my-file.md')).toBe('PathToMyFile');
      expect(toTitleCase('kebab-case-example.mdx')).toBe('KebabCaseExample');
    });
  });
});
