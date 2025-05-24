import React from 'react';
import { Box } from 'ink';
import { Text } from 'ink';
import { Spacer } from 'ink';
import BigText from 'ink-big-text';
import Markdown from 'ink-markdown';
import Ascii from 'ink-ascii';
import chalk from 'chalk';

import type {
  Section,
  HeroSection,
  ProblemSection,
  FeaturesSection,
  PricingSection,
  TestimonialsSection,
  FAQSection,
  CallToActionSection,
  TeamSection,
  FeatureItem as FeatureItemType,
  PricingPlan,
  Testimonial,
  FAQItem as FAQItemType,
  TeamMember
} from '@mdxui/core/landing-page';

/**
 * Base Section component with common styling
 */
export const BaseSection: React.FC<{ children: React.ReactNode; title?: string; badge?: string }> = ({ 
  children, 
  title,
  badge
}) => {
  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="blue">
      {badge && (
        <Box marginBottom={1}>
          <Text color="yellow">{badge}</Text>
        </Box>
      )}
      {title && (
        <Box marginBottom={1}>
          <Text bold color="blue">{title}</Text>
        </Box>
      )}
      <Box>{children}</Box>
    </Box>
  );
};

/**
 * Hero section component for CLI
 */
export const Hero: React.FC<HeroSection> = ({
  headline,
  description,
  primaryActionText,
  primaryActionLink,
  secondaryActionText,
  secondaryActionLink,
  badge
}) => {
  return (
    <Box flexDirection="column" padding={1} borderStyle="double" borderColor="green">
      {badge && <Text color="yellow">{badge}</Text>}
      <BigText text={headline} font="simple" colors={['cyan']} />
      <Box marginY={1}>
        <Markdown>{description}</Markdown>
      </Box>
      <Box marginY={1} flexDirection="column">
        <Text bold color="green">
          {`→ ${primaryActionText}: `}
          <Text color="blue">{primaryActionLink}</Text>
        </Text>
        {secondaryActionText && secondaryActionLink && (
          <Text color="gray">
            {`→ ${secondaryActionText}: `}
            <Text color="blue">{secondaryActionLink}</Text>
          </Text>
        )}
      </Box>
    </Box>
  );
};

/**
 * Problem section component for CLI
 */
export const Problem: React.FC<ProblemSection> = ({
  headline,
  description,
  points,
  badge
}) => {
  return (
    <BaseSection title={headline} badge={badge}>
      {description && (
        <Box marginBottom={1}>
          <Markdown>{description}</Markdown>
        </Box>
      )}
      {points && points.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {points.map((point: string, i: number) => (
            <Box key={i}>
              <Text color="red">✗ </Text>
              <Text>{point}</Text>
            </Box>
          ))}
        </Box>
      )}
    </BaseSection>
  );
};

/**
 * Feature item component for CLI
 */
const FeatureItem: React.FC<FeatureItemType> = ({
  title,
  description
}) => {
  return (
    <Box flexDirection="column" marginBottom={1} paddingX={1}>
      <Text bold color="green">{title}</Text>
      {description && <Text dimColor>{description}</Text>}
    </Box>
  );
};

/**
 * Features section component for CLI
 */
export const Features: React.FC<FeaturesSection> = ({
  headline,
  description,
  features,
  badge,
  primaryActionText,
  primaryActionLink
}) => {
  return (
    <BaseSection title={headline} badge={badge}>
      {description && (
        <Box marginBottom={1}>
          <Markdown>{description}</Markdown>
        </Box>
      )}
      <Box flexDirection="column" marginY={1}>
        {features.map((feature: FeatureItemType, i: number) => (
          <FeatureItem key={i} {...feature} />
        ))}
      </Box>
      {primaryActionText && primaryActionLink && (
        <Box marginTop={1}>
          <Text bold color="green">
            {`→ ${primaryActionText}: `}
            <Text color="blue">{primaryActionLink}</Text>
          </Text>
        </Box>
      )}
    </BaseSection>
  );
};

/**
 * Pricing plan component for CLI
 */
const PricingPlanComponent: React.FC<PricingPlan> = ({
  name,
  price,
  description,
  features,
  ctaText,
  ctaLink,
  featured
}) => {
  const borderColor = featured ? 'green' : 'blue';
  const nameColor = featured ? 'green' : 'blue';
  
  return (
    <Box 
      flexDirection="column" 
      borderStyle="round" 
      borderColor={borderColor}
      padding={1}
      marginRight={2}
      marginBottom={1}
      width={30}
    >
      <Text bold color={nameColor}>{name}</Text>
      {featured && <Text color="yellow">★ Popular</Text>}
      <Text bold color="white">
        <Box>
          <Text color="white" dimColor={false}>{price}</Text>
        </Box>
      </Text>
      {description && <Text dimColor>{description}</Text>}
      <Spacer />
      <Box flexDirection="column" marginY={1}>
        {features.map((feature: string, i: number) => (
          <Box key={i}>
            <Text color="green">✓ </Text>
            <Text>{feature}</Text>
          </Box>
        ))}
      </Box>
      {ctaText && ctaLink && (
        <Box marginTop={1}>
          <Text color="blue">{`→ ${ctaText}: ${ctaLink}`}</Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * Pricing section component for CLI
 */
export const Pricing: React.FC<PricingSection> = ({
  headline,
  description,
  plans,
  note,
  badge
}) => {
  return (
    <BaseSection title={headline} badge={badge}>
      {description && (
        <Box marginBottom={1}>
          <Markdown>{description}</Markdown>
        </Box>
      )}
      <Box flexDirection="row" flexWrap="wrap" marginY={1}>
        {plans.map((plan: PricingPlan, i: number) => (
          <PricingPlanComponent key={i} {...plan} />
        ))}
      </Box>
      {note && (
        <Box marginTop={1}>
          <Text italic dimColor>{note}</Text>
        </Box>
      )}
    </BaseSection>
  );
};

/**
 * Testimonial component for CLI
 */
const TestimonialComponent: React.FC<Testimonial> = ({
  quote,
  author,
  authorTitle
}) => {
  return (
    <Box 
      flexDirection="column" 
      borderStyle="round" 
      borderColor="blue"
      padding={1}
      marginRight={2}
      marginBottom={1}
      width={40}
    >
      <Text italic>"{quote}"</Text>
      <Box marginTop={1}>
        <Text bold>— {author}</Text>
        {authorTitle && <Text dimColor>, {authorTitle}</Text>}
      </Box>
    </Box>
  );
};

/**
 * Testimonials section component for CLI
 */
export const Testimonials: React.FC<TestimonialsSection> = ({
  headline,
  description,
  testimonials,
  badge
}) => {
  return (
    <BaseSection title={headline} badge={badge}>
      {description && (
        <Box marginBottom={1}>
          <Markdown>{description}</Markdown>
        </Box>
      )}
      <Box flexDirection="row" flexWrap="wrap" marginY={1}>
        {testimonials.map((testimonial: Testimonial, i: number) => (
          <TestimonialComponent key={i} {...testimonial} />
        ))}
      </Box>
    </BaseSection>
  );
};

/**
 * FAQ item component for CLI
 */
const FAQItem: React.FC<FAQItemType> = ({
  question,
  answer
}) => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="blue">Q: {question}</Text>
      <Box marginLeft={2}>
        <Text>A: {answer}</Text>
      </Box>
    </Box>
  );
};

/**
 * FAQ section component for CLI
 */
export const FAQ: React.FC<FAQSection> = ({
  headline,
  description,
  faqs,
  badge
}) => {
  return (
    <BaseSection title={headline} badge={badge}>
      {description && (
        <Box marginBottom={1}>
          <Markdown>{description}</Markdown>
        </Box>
      )}
      <Box flexDirection="column" marginY={1}>
        {faqs.map((faq: FAQItemType, i: number) => (
          <FAQItem key={i} {...faq} />
        ))}
      </Box>
    </BaseSection>
  );
};

/**
 * Call-To-Action section component for CLI
 */
export const CallToAction: React.FC<CallToActionSection> = ({
  headline,
  description,
  primaryActionText,
  primaryActionLink,
  secondaryActionText,
  secondaryActionLink,
  badge
}) => {
  return (
    <Box flexDirection="column" padding={1} borderStyle="double" borderColor="green">
      {badge && <Text color="yellow">{badge}</Text>}
      <Ascii text={headline} font="doom" />
      {description && (
        <Box marginY={1}>
          <Markdown>{description}</Markdown>
        </Box>
      )}
      <Box marginY={1} flexDirection="column">
        <Text bold color="black">
          <Box>
            <Text color="green" dimColor={false}>
              {`→ ${primaryActionText}: `}
              <Text bold color="blue">{primaryActionLink}</Text>
            </Text>
          </Box>
        </Text>
        {secondaryActionText && secondaryActionLink && (
          <Text color="gray">
            {`→ ${secondaryActionText}: `}
            <Text color="blue">{secondaryActionLink}</Text>
          </Text>
        )}
      </Box>
    </Box>
  );
};

/**
 * Team member component for CLI
 */
const TeamMemberComponent: React.FC<TeamMember> = ({
  name,
  role,
  bio
}) => {
  return (
    <Box 
      flexDirection="column" 
      borderStyle="round" 
      borderColor="blue"
      padding={1}
      marginRight={2}
      marginBottom={1}
      width={30}
    >
      <Text bold>{name}</Text>
      <Text color="blue">{role}</Text>
      {bio && <Text dimColor>{bio}</Text>}
    </Box>
  );
};

/**
 * Team section component for CLI
 */
export const Team: React.FC<TeamSection> = ({
  headline,
  description,
  members,
  badge
}) => {
  return (
    <BaseSection title={headline} badge={badge}>
      {description && (
        <Box marginBottom={1}>
          <Markdown>{description}</Markdown>
        </Box>
      )}
      <Box flexDirection="row" flexWrap="wrap" marginY={1}>
        {members.map((member: TeamMember, i: number) => (
          <TeamMemberComponent key={i} {...member} />
        ))}
      </Box>
    </BaseSection>
  );
};

/**
 * Default components to provide to MDX
 */
export const landingPageComponents = {
  Hero,
  Problem,
  Features,
  Pricing,
  Testimonials,
  FAQ,
  CallToAction,
  Team
};
