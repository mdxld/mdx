import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
  }
}

interface RevealOptions {
  plugins?: any[];
  hash?: boolean;
  slideNumber?: boolean;
  [key: string]: any;
}

interface RevealApi {
  initialize: () => void;
  destroy: () => void;
}

interface SlidesProps {
  children: React.ReactNode;
  options?: RevealOptions;
}

export function Slides({ children, options }: SlidesProps) {
  const deckRef = useRef<RevealApi | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initReveal = async () => {
      try {
        if (typeof window !== 'undefined' && !deckRef.current) {
          const RevealModule = await import('reveal.js');
          const Reveal = RevealModule.default;
          
          const MarkdownModule = await import('reveal.js/plugin/markdown/markdown.esm.js');
          const Markdown = MarkdownModule.default;
          
          const HighlightModule = await import('reveal.js/plugin/highlight/highlight.esm.js');
          const Highlight = HighlightModule.default;
          
          const NotesModule = await import('reveal.js/plugin/notes/notes.esm.js');
          const Notes = NotesModule.default;
          
          
          const revealOptions = {
            plugins: [Markdown, Highlight, Notes],
            hash: true,
            slideNumber: true,
            ...(options || {})
          };
          
          deckRef.current = new Reveal(containerRef.current!, revealOptions);
          deckRef.current.initialize();
        }
      } catch (error) {
        console.error('Error initializing Reveal.js:', error);
      }
    };

    initReveal();

    return () => {
      if (deckRef.current) {
        deckRef.current.destroy();
        deckRef.current = null;
      }
    };
  }, [options]);

  return (
    <div className="reveal" ref={containerRef}>
      <div className="slides">{children}</div>
    </div>
  );
}
