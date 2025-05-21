import { createLibraryConfig } from '@repo/tsup-config';

export default createLibraryConfig(['index.ts', 'card.ts', 'gradient.ts'], {
  external: ['tailwindcss', 'react'],
});
