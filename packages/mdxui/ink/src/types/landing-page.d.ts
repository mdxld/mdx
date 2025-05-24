declare module '@mdxui/core/landing-page' {
  export interface Section {
    badge?: string;
    headline?: string;
    description?: string;
    primaryActionText?: string;
    primaryActionLink?: string;
    secondaryActionText?: string;
    secondaryActionLink?: string;
  }

  export interface HeroSection extends Section {
    headline: string;
    description: string;
    primaryActionText: string;
    primaryActionLink: string;
    secondaryActionText?: string;
    secondaryActionLink?: string;
    mediaUrl?: string;
    mediaAlt?: string;
    mediaType?: 'image' | 'video';
  }

  export interface ProblemSection extends Section {
    headline?: string;
    description?: string;
    points?: string[];
    imageUrl?: string;
    imageAlt?: string;
  }

  export interface FeatureItem {
    title: string;
    description?: string;
    iconUrl?: string;
    iconAlt?: string;
  }

  export interface FeaturesSection extends Section {
    headline?: string;
    description?: string;
    features: FeatureItem[];
  }

  export interface PricingPlan {
    name: string;
    price: string;
    description?: string;
    features: string[];
    ctaText?: string;
    ctaLink?: string;
    featured?: boolean;
  }

  export interface PricingSection extends Section {
    headline?: string;
    description?: string;
    plans: PricingPlan[];
    note?: string;
  }

  export interface Testimonial {
    quote: string;
    author: string;
    authorTitle?: string;
    authorImageUrl?: string;
    authorImageAlt?: string;
  }

  export interface TestimonialsSection extends Section {
    headline?: string;
    description?: string;
    testimonials: Testimonial[];
    logos?: { imageUrl: string; alt?: string }[];
  }

  export interface FAQItem {
    question: string;
    answer: string;
  }

  export interface FAQSection extends Section {
    headline?: string;
    description?: string;
    faqs: FAQItem[];
  }

  export interface CallToActionSection extends Section {
    headline: string;
    description?: string;
    primaryActionText: string;
    primaryActionLink: string;
    secondaryActionText?: string;
    secondaryActionLink?: string;
  }

  export interface TeamMember {
    name: string;
    role: string;
    photoUrl?: string;
    photoAlt?: string;
    bio?: string;
  }

  export interface TeamSection extends Section {
    headline?: string;
    description?: string;
    members: TeamMember[];
  }

  export type LandingPageSection =
    | { type: 'hero'; data: HeroSection }
    | { type: 'problem'; data: ProblemSection }
    | { type: 'features'; data: FeaturesSection }
    | { type: 'pricing'; data: PricingSection }
    | { type: 'testimonials'; data: TestimonialsSection }
    | { type: 'faq'; data: FAQSection }
    | { type: 'cta'; data: CallToActionSection }
    | { type: 'team'; data: TeamSection };
}
