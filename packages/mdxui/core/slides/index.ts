import { ReactNode } from 'react';

/**
 * Title slide properties
 * 
 * @interface TitleSlideProps
 * @description Main introduction slide typically used at the beginning of presentations
 */
export interface TitleSlideProps {
  /** Main title text */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** URL for logo image */
  logoUrl?: string;
  /** Presenter name and title */
  presenter?: string;
  /** Contact info (email, website) */
  contact?: string;
}

/**
 * Bullet list slide properties
 * 
 * @interface BulletListSlideProps
 * @description Slide with a title and a list of bullet points
 */
export interface BulletListSlideProps {
  /** Slide heading */
  title: string;
  /** List of bullet points */
  items: string[];
  /** Whether list is numbered (default: false) */
  ordered?: boolean;
}

/**
 * Text content slide properties
 * 
 * @interface TextContentSlideProps
 * @description Slide with a title and paragraph content
 */
export interface TextContentSlideProps {
  /** Slide heading */
  title: string;
  /** Paragraph or rich text content */
  content: string;
  /** Optional character limit hint */
  maxChars?: number;
}

/**
 * Code slide properties
 * 
 * @interface CodeSlideProps
 * @description Slide for displaying code snippets with syntax highlighting
 */
export interface CodeSlideProps {
  /** Slide heading */
  title: string;
  /** Code snippet (supports markdown fences) */
  code: string;
  /** Caption or explanation below code */
  caption?: string;
  /** Language for syntax highlighting */
  language?: string;
}

/**
 * Diagram slide properties
 * 
 * @interface DiagramSlideProps
 * @description Slide for displaying diagrams or charts
 */
export interface DiagramSlideProps {
  /** Slide heading */
  title: string;
  /** URL or Mermaid definition */
  diagramSrc: string;
  /** Array of annotation texts */
  callouts?: string[];
}

/**
 * Two column slide properties
 * 
 * @interface TwoColumnSlideProps
 * @description Slide with content split into two columns
 */
export interface TwoColumnSlideProps {
  /** Content for left column */
  left: ReactNode;
  /** Content for right column */
  right: ReactNode;
  /** Optional slide heading */
  title?: string;
}

/**
 * Table and chart slide properties
 * 
 * @interface TableChartSlideProps
 * @description Slide for displaying tabular data with optional chart
 */
export interface TableChartSlideProps {
  /** Slide heading */
  title: string;
  /** 2D array for table rows/columns */
  tableData: object[][];
  /** URL for chart image or embed code */
  chartUrl?: string;
}

/**
 * Quote slide properties
 * 
 * @interface QuoteSlideProps
 * @description Slide for displaying a quote or significant statement
 */
export interface QuoteSlideProps {
  /** Main quote or fact text */
  quote: string;
  /** Source or speaker attribution */
  attribution?: string;
}

/**
 * Media slide properties
 * 
 * @interface MediaSlideProps
 * @description Slide for displaying images or videos
 */
export interface MediaSlideProps {
  /** Media type - 'image' or 'video' */
  mediaType: 'image' | 'video';
  /** URL to media file */
  src: string;
  /** Caption text */
  caption?: string;
}

/**
 * Closing slide properties
 * 
 * @interface ClosingSlideProps
 * @description Final slide of a presentation
 */
export interface ClosingSlideProps {
  /** Closing message (e.g. 'Thank You' or 'Questions?') */
  message: string;
  /** Contact info or next steps */
  contact?: string;
}