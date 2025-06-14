export const SUPPORTED_EXTENSIONS = ['.md', '.mdx', '.mdxld', '.txt'];
export const SUPPORTED_MIME_TYPES = ['text/plain', 'text/markdown'];

export function isSupportedFile(url: string, mimeType?: string): boolean {
  const hasValidExtension = SUPPORTED_EXTENSIONS.some(ext => 
    url.toLowerCase().endsWith(ext)
  );
  
  const hasValidMimeType = mimeType && SUPPORTED_MIME_TYPES.includes(mimeType);
  
  const isTextFile = mimeType?.startsWith('text/') || false;
  
  return hasValidExtension || hasValidMimeType || isTextFile;
}

export function getFileExtension(url: string): string {
  const match = url.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'txt';
}
