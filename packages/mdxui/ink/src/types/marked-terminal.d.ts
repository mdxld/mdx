declare module 'marked-terminal' {
  import { Renderer, MarkedExtension } from 'marked';
  
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
  
  class TerminalRenderer extends Renderer implements MarkedExtension {
    constructor(options?: TerminalRendererOptions);
    options: TerminalRendererOptions;
    code(code: string, infostring: string, escaped: boolean): string;
    blockquote(quote: string): string;
    html(html: string): string;
    heading(text: string, level: number): string;
    hr(): string;
    list(body: string, ordered: boolean): string;
    listitem(text: string): string;
    checkbox(checked: boolean): string;
    paragraph(text: string): string;
    table(header: string, body: string): string;
    tablerow(content: string): string;
    tablecell(content: string, flags: { header: boolean; align: 'center' | 'left' | 'right' | null }): string;
    strong(text: string): string;
    em(text: string): string;
    codespan(text: string): string;
    br(): string;
    del(text: string): string;
    link(href: string, title: string, text: string): string;
    image(href: string, title: string, text: string): string;
    text(text: string): string;
  }
  
  export default TerminalRenderer;
}
