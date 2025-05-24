import { TODO } from "../types";

// Common enums/types
export type UseCase =
  | 'InvestorPitch'
  | 'ProductDemo'
  | 'TechTalk'
  | 'Onboarding'
  | 'Keynote';

export type SlideType =
  | 'Title'
  | 'Section'
  | 'Content'
  | 'Code'
  | 'Image'
  | 'Chart';

export type LayoutType =
  | 'SingleColumn'
  | 'TwoColumn'
  | 'Split'
  | 'FullBleed'
  | 'Centered';

export type Theme = 'Light' | 'Dark' | string;

export type NarrativeRole =
  | 'Intro'
  | 'Problem'
  | 'Solution'
  | 'Approach'
  | 'Results'
  | 'Conclusion'
  | 'CallToAction';

// Supporting interfaces
export interface TypographySettings {
  fontFamily: string;
  headingSize: number;    // in pt
  bodySize: number;       // in pt
  maxLineLength?: number; // e.g. ~6 words per line
}

export interface ColorScheme {
  background: string;     // e.g. '#ffffff' or 'black'
  text: string;           // e.g. '#333333'
  primary: string;        // accent color
  secondary?: string;     // optional accent
}

export interface ImageAsset {
  src: string;
  alt: string;
  width?: number;         // for layout guidance
  height?: number;
}

export interface CodeSnippet {
  language: string;       // e.g. 'ts', 'js', 'bash'
  code: string;
  highlightLines?: number[]; 
  theme?: Theme;          // light/dark for syntax highlighting
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | string;
  data: TODO;              // you could type this more strictly
  labels?: string[];
  description?: string;   // for accessibility
}

// The Slide interface
export interface Slide {
  /** Unique identifier */
  id: string;

  /** High-level type of slide */
  type: SlideType;

  /** Role in the narrative arc (e.g. 'Problem', 'Solution') */
  narrativeRole?: NarrativeRole;

  /** Short, meaningful title (if applicable) */
  title?: string;

  /** Main textual or markdown content */
  content?: string;

  /** Layout hint for rendering */
  layout: LayoutType;

  /** Overrides for typography (falls back to deck defaults) */
  typography?: TypographySettings;

  /** Overrides for colors (falls back to deck defaults) */
  colorScheme?: ColorScheme;

  /** One or more images/icons used on this slide */
  images?: ImageAsset[];

  /** If this is a code-focused slide */
  codeSnippet?: CodeSnippet;

  /** If this slide shows a chart or graph */
  chart?: ChartConfig;

  /** Optional bullet points (if using a list) */
  bulletPoints?: string[];

  /** Transition or build style (e.g. 'fade', 'appear') */
  transition?: string;
}

// The Deck interface
export interface Deck {
  /** Unique identifier */
  id: string;

  /** Deck title (e.g. 'Q2 Investor Update') */
  title: string;

  /** Short description or subtitle */
  description?: string;

  /** What kind of presentation this is */
  useCase: UseCase;

  /** Global theme (light/dark or custom) */
  theme: Theme;

  /** Default layout for slides in this deck */
  defaultLayout: LayoutType;

  /** Default typography settings for the deck */
  defaultTypography: TypographySettings;

  /** Default color scheme for the deck */
  defaultColorScheme: ColorScheme;

  /** Author or presenter name */
  author?: string;

  /** Creation date */
  createdAt?: Date;

  /** Ordered list of slides */
  slides: Slide[];
}