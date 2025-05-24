/**
 * Landing page section interfaces for mdxui
 *
 * These interfaces define the structure of common landing page sections
 * in a framework-agnostic way. They can be used with different UI implementations
 * like Shadcn (web) or Ink (CLI).
 */

/**
 * Base Section interface with common properties shared across section types
 */
export interface Section {
  /** Optional small badge or eyebrow text to highlight above headline */
  badge?: string
  /** Main headline or title for this section */
  headline?: string
  /** Longer description or supporting text for the section */
  description?: string
  /** Primary CTA button text (e.g. "Sign Up") */
  primaryActionText?: string
  /** URL or link target for the primary CTA */
  primaryActionLink?: string
  /** Secondary CTA text (less emphasized action) */
  secondaryActionText?: string
  /** URL or link target for the secondary CTA */
  secondaryActionLink?: string
}

/**
 * Hero section - The attention-grabbing top section of a landing page
 */
export interface HeroSection extends Section {
  /** Required: main headline to grab attention (e.g., unique value proposition) */
  headline: string
  /** Required: supporting text to elaborate on headline */
  description: string
  /** Required: primary call-to-action text (prominent button) */
  primaryActionText: string
  /** Required: primary call-to-action link URL */
  primaryActionLink: string
  /** Optional: secondary call-to-action text */
  secondaryActionText?: string
  /** Optional: secondary call-to-action link URL */
  secondaryActionLink?: string
  /** Optional image or media (illustration or video) to reinforce the message */
  mediaUrl?: string
  /** Alternate text for the image (if mediaUrl is an image) */
  mediaAlt?: string
  /** Media type indicator, e.g. "image" or "video" (default "image" if not set) */
  mediaType?: 'image' | 'video'
}

/**
 * Problem/Pain Agitation section - Highlights pain points that the product/service solves
 */
export interface ProblemSection extends Section {
  /** Headline framing the user's pain point or problem */
  headline?: string
  /** Description or narrative that agitates the problem (e.g., what's at stake, why it hurts) */
  description?: string
  /** Optional list of specific pain points or bullet statements for emphasis */
  points?: string[]
  /** Optional image illustrating the problem scenario */
  imageUrl?: string
  /** Alt text for the image (if provided) */
  imageAlt?: string
}

/**
 * Feature item for use in Features/Benefits section
 */
export interface FeatureItem {
  /** Title or short name of the feature/benefit */
  title: string
  /** Description of the feature, focusing on benefit to user */
  description?: string
  /** Optional icon or image URL representing the feature */
  iconUrl?: string
  /** Alt text for the icon/image */
  iconAlt?: string
}

/**
 * Features/Benefits (Solution) section - Highlights what the product offers and how it solves the problem
 */
export interface FeaturesSection extends Section {
  /** Section headline (e.g. "Features" or value proposition) */
  headline?: string
  /** Section description, if any, elaborating on the value */
  description?: string
  /** List of key features or benefits offered */
  features: FeatureItem[]
}

/**
 * Pricing plan for use in Pricing section
 */
export interface PricingPlan {
  /** Name of the plan (e.g., "Basic", "Pro") */
  name: string
  /** Price display (could be a formatted string like "$10/mo" or "$99/year") */
  price: string
  /** Short description or tagline for the plan */
  description?: string
  /** Features or benefits included in this plan (bullet points) */
  features: string[]
  /** CTA text for this plan (e.g., "Buy Now", "Start Free Trial") */
  ctaText?: string
  /** Link URL for the plan's CTA */
  ctaLink?: string
  /** Flag to mark a recommended or popular plan */
  featured?: boolean
}

/**
 * Pricing section - Displays pricing tiers and options
 */
export interface PricingSection extends Section {
  /** Section headline, e.g. "Pricing" */
  headline?: string
  /** Section description, e.g. "Choose the plan that suits your needs." */
  description?: string
  /** List of pricing plans on offer */
  plans: PricingPlan[]
  /** Optional note or disclaimer (e.g., "*All prices include ...") */
  note?: string
}

/**
 * Testimonial for use in Testimonials section
 */
export interface Testimonial {
  /** The quoted feedback text from the customer */
  quote: string
  /** Name of the person giving the testimonial */
  author: string
  /** Optional subtitle for the author (e.g., their title and company) */
  authorTitle?: string
  /** URL of the author's photo or avatar */
  authorImageUrl?: string
  /** Alternate text for the author's image */
  authorImageAlt?: string
}

/**
 * Testimonials (Social Proof) section - Showcases customer feedback and social proof
 */
export interface TestimonialsSection extends Section {
  /** Section headline, e.g. "What our clients are saying" */
  headline?: string
  /** (Optional) brief intro or tagline for the testimonials section */
  description?: string
  /** List of testimonial entries */
  testimonials: Testimonial[]
  /** Optional collection of logos for additional social proof */
  logos?: { imageUrl: string; alt?: string }[]
}

/**
 * FAQ item for use in FAQ section
 */
export interface FAQItem {
  /** The question being asked */
  question: string
  /** The answer to the question */
  answer: string
}

/**
 * FAQ section - Addresses common questions and concerns
 */
export interface FAQSection extends Section {
  /** Section headline, e.g. "Frequently Asked Questions" */
  headline?: string
  /** Optionally, a brief intro text for the FAQ section */
  description?: string
  /** List of question-answer entries */
  faqs: FAQItem[]
}

/**
 * Call-To-Action section - Final prompt for user action
 */
export interface CallToActionSection extends Section {
  /** Required headline to make the final pitch (e.g., "Ready to join us?") */
  headline: string
  /** Optional supporting text encouraging the user */
  description?: string
  /** Primary CTA text (e.g., "Sign Up Now") – should be provided */
  primaryActionText: string
  /** Primary CTA link URL */
  primaryActionLink: string
  /** (Optional) secondary CTA text (e.g., "Contact Sales") */
  secondaryActionText?: string
  /** (Optional) secondary CTA link URL */
  secondaryActionLink?: string
}

/**
 * Team member for use in Team/About section
 */
export interface TeamMember {
  /** Name of the team member */
  name: string
  /** Role or title of the team member */
  role: string
  /** URL of member's photo */
  photoUrl?: string
  /** Alt text for the photo */
  photoAlt?: string
  /** Short bio or description for the member (optional) */
  bio?: string
}

/**
 * Team/About section - Showcases team members or company information
 */
export interface TeamSection extends Section {
  /** Section headline, e.g. "Our Team" or "About Us" */
  headline?: string
  /** Optional subheading or description for the section */
  description?: string
  /** List of team members to display */
  members: TeamMember[]
}

/**
 * Union type for all landing page section types
 */
export type LandingPageSection =
  | { type: 'hero'; data: HeroSection }
  | { type: 'problem'; data: ProblemSection }
  | { type: 'features'; data: FeaturesSection }
  | { type: 'pricing'; data: PricingSection }
  | { type: 'testimonials'; data: TestimonialsSection }
  | { type: 'faq'; data: FAQSection }
  | { type: 'cta'; data: CallToActionSection }
  | { type: 'team'; data: TeamSection }
