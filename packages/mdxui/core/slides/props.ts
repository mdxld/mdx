import { TODO } from "../types";

/** Props for a Title Slide component */
export interface TitleSlideProps {
  /** Main title text of the slide */
  title: string;
  /** Secondary text or tagline under the title */
  subtitle?: string;
  /** URL of the company or product logo */
  logoUrl?: string;
  /** Tailwind CSS classes for the slide background (e.g. gradient or color) */
  backgroundClass?: string;
  /** Tailwind CSS classes for the title/text color */
  textClass?: string;
  /** Notes for the speaker about how to present this slide */
  speakerNotes?: string;
  /** Guidance or rationale on the slide’s visual/design intent */
  designDescription?: string;
}

/** Props for an Agenda Slide component */
export interface AgendaSlideProps {
  /** List of agenda items with timing and description */
  items: Array<{
    /** Time or sequence label (e.g. “10:00 AM”, “1.”) */
    time: string;
    /** Title or activity description */
    activity: string;
    /** Optional icon URL to represent this activity */
    iconUrl?: string;
  }>;
  /** Accent color class for headings or dividing lines */
  accentClass?: string;
  /** Notes for the speaker about pacing or emphasis */
  speakerNotes?: string;
  /** Guidance on alignment, spacing, or brand voice */
  designDescription?: string;
}

/** Props for a Problem–Solution Slide component */
export interface ProblemSolutionSlideProps {
  /** Heading for the “Problem” half */
  problemTitle: string;
  /** Key bullet points outlining the problem */
  problemPoints: string[];
  /** Heading for the “Solution” half */
  solutionTitle: string;
  /** Key bullet points describing the solution */
  solutionPoints: string[];
  /** Optional split-background classes (e.g. left white, right blue) */
  splitBackgroundClass?: { left: string; right: string };
  /** Icon URLs to pair with each solution point */
  solutionIcons?: string[];
  /** Notes for the speaker on how to transition between problem and solution */
  speakerNotes?: string;
  /** Designer notes on color contrast and balance */
  designDescription?: string;
}

/** Props for a Product Showcase Slide component */
export interface ProductShowcaseSlideProps {
  /** Main headline or value proposition */
  title: string;
  /** Brief descriptive text or tagline */
  description?: string;
  /** URLs of product images or mockups */
  productImageUrls: string[];
  /** Tailwind CSS classes for the background to match brand colors */
  backgroundClass?: string;
  /** CSS classes to style the title/description text */
  textClass?: string;
  /** Notes for the speaker on highlighting product features */
  speakerNotes?: string;
  /** Design rationale on imagery, whitespace, and hierarchy */
  designDescription?: string;
}

/** Props for a Data Visualization Slide component */
export interface DataVisualizationSlideProps {
  /** Numeric key metrics to display prominently (e.g. 56k, 43k) */
  metrics?: Array<{ label: string; value: number | string }>;
  /** Configuration for charts or infographics */
  charts?: Array<{
    /** Type of chart (e.g. “bar”, “line”, “pie”, “infographic”) */
    type: string;
    /** Data payload—structure depends on chart type */
    data: TODO;
    /** Optional caption or label for the chart */
    caption?: string;
  }>;
  /** Tailwind classes for backgrounds or highlights */
  accentClass?: string;
  /** Speaker notes on drawing attention to specific data points */
  speakerNotes?: string;
  /** Guidance for the designer on color palette and typography */
  designDescription?: string;
}

/** Props for a Timeline/Roadmap Slide component */
export interface TimelineSlideProps {
  /** Ordered milestones or steps in the timeline */
  milestones: Array<{
    /** Title of the milestone */
    title: string;
    /** Optional date or quarter (e.g. “Q3 2025”) */
    date?: string;
    /** Short description of the milestone */
    description?: string;
    /** Icon URL representing the milestone visually */
    iconUrl?: string;
  }>;
  /** Tailwind classes for the connecting line or dots */
  lineClass?: string;
  /** Accent class for milestone markers */
  markerClass?: string;
  /** Speaker notes on pacing through each stage */
  speakerNotes?: string;
  /** Notes on iconography style and spacing */
  designDescription?: string;
}

/** Props for a Call-to-Action / Contact Slide component */
export interface CallToActionSlideProps {
  /** Main call-to-action text (e.g. “Get in Touch”) */
  ctaText: string;
  /** URL or mailto link to invoke on click */
  ctaLink: string;
  /** Optional list of contact channels */
  contacts?: Array<{
    /** Type of contact (e.g. “email”, “twitter”) */
    type: string;
    /** URL or handle */
    value: string;
  }>;
  /** Tailwind CSS classes for background and text */
  backgroundClass?: string;
  /** Speaker notes on how to close the presentation */
  speakerNotes?: string;
  /** Designer notes on boldness, tone, and layout impact */
  designDescription?: string;
}