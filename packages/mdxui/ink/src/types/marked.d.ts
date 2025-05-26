declare module 'marked' {
  export interface MarkedOptions {
    renderer?: any;
    gfm?: boolean;
    tables?: boolean;
    breaks?: boolean;
    pedantic?: boolean;
    sanitize?: boolean;
    smartLists?: boolean;
    smartypants?: boolean;
    xhtml?: boolean;
    [key: string]: any;
  }

  export interface MarkedExtension {
    [key: string]: any;
  }

  export class Renderer {
    constructor(options?: any);
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

  export function marked(src: string, options?: MarkedOptions): string;
  export function setOptions(options: MarkedOptions): void;
}
