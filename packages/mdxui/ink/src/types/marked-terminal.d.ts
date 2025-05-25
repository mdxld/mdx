declare module 'marked-terminal' {
  import { MarkedExtension } from 'marked';
  
  interface TerminalRendererOptions {
    width?: number;
    reflowText?: boolean;
    showSectionPrefix?: boolean;
    unescape?: boolean;
    code?: (code: string, lang: string) => string;
    heading?: (text: string, level: number) => string;
    list?: (body: string, ordered: boolean) => string;
    listitem?: (text: string) => string;
    strong?: (text: string) => string;
    em?: (text: string) => string;
    link?: (href: string, title: string, text: string) => string;
    blockquote?: (quote: string) => string;
    table?: (header: string, body: string) => string;
    [key: string]: any;
  }
  
  class TerminalRenderer implements MarkedExtension {
    constructor(options?: TerminalRendererOptions);
  }
  
  export default TerminalRenderer;
}
