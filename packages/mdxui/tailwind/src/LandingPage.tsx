import React, { forwardRef } from 'react'

import {
  HeroSection,
  ProblemSection,
  FeaturesSection,
  PricingSection,
  TestimonialsSection,
  FAQSection,
  CallToActionSection,
  TeamSection,
  FeatureItem,
  PricingPlan,
  Testimonial,
  FAQItem,
  TeamMember
} from 'mdxui'

/**
 * Utility function to conditionally join class names
 */
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ')
}

export const Hero = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & HeroSection>(
  ({ className, headline, description, primaryActionText, primaryActionLink, secondaryActionText, secondaryActionLink, mediaUrl, mediaAlt, mediaType = 'image', badge, ...props }, ref) => (
    <section
      ref={ref}
      className={cn('relative w-full py-12 md:py-24 lg:py-32 overflow-hidden', className)}
      {...props}
    >
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="flex flex-col justify-center space-y-4">
            {badge && (
              <div className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm">
                {badge}
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
              {headline}
            </h1>
            <p className="max-w-[600px] text-gray-500 dark:text-gray-400 md:text-xl">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={primaryActionLink}
                className="inline-flex h-12 items-center justify-center rounded-full bg-black px-6 font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                {primaryActionText}
              </a>
              {secondaryActionText && secondaryActionLink && (
                <a
                  href={secondaryActionLink}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-gray-200 bg-white px-6 font-medium text-black transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900"
                >
                  {secondaryActionText}
                </a>
              )}
            </div>
          </div>
          {mediaUrl && (
            <div className="relative lg:ml-auto">
              <div className="relative">
                {mediaType === 'image' ? (
                  <img
                    src={mediaUrl}
                    alt={mediaAlt || headline}
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
                    width={550}
                    height={310}
                  />
                ) : (
                  <video
                    src={mediaUrl}
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
                    width={550}
                    height={310}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
)
Hero.displayName = 'Hero'

export const Problem = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & ProblemSection>(
  ({ className, headline, description, points, imageUrl, imageAlt, badge, ...props }, ref) => (
    <section
      ref={ref}
      className={cn('w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900', className)}
      {...props}
    >
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          {imageUrl && (
            <div className="order-2 lg:order-1">
              <img
                src={imageUrl}
                alt={imageAlt || headline || 'Problem illustration'}
                className="mx-auto rounded-lg object-cover"
                width={500}
                height={500}
              />
            </div>
          )}
          <div className={cn("space-y-4", imageUrl ? "order-1 lg:order-2" : "")}>
            {badge && (
              <div className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm">
                {badge}
              </div>
            )}
            {headline && (
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {headline}
              </h2>
            )}
            {description && (
              <p className="max-w-[600px] text-gray-500 dark:text-gray-400 md:text-xl">
                {description}
              </p>
            )}
            {points && points.length > 0 && (
              <ul className="space-y-2">
                {points.map((point: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-black dark:text-white"
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
)
Problem.displayName = 'Problem'

export const FeatureCard = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & FeatureItem>(
  ({ className, title, description, iconUrl, iconAlt, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950', className)}
      {...props}
    >
      <div className="flex flex-col space-y-4">
        {iconUrl && (
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <img
              src={iconUrl}
              alt={iconAlt || title}
              className="h-5 w-5"
            />
          </div>
        )}
        <h3 className="text-lg font-bold">{title}</h3>
        {description && (
          <p className="text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
    </div>
  )
)
FeatureCard.displayName = 'FeatureCard'

export const Features = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & FeaturesSection>(
  ({ className, headline, description, features, badge, primaryActionText, primaryActionLink, secondaryActionText, secondaryActionLink, ...props }, ref) => (
    <section
      ref={ref}
      className={cn('w-full py-12 md:py-24 lg:py-32', className)}
      {...props}
    >
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {badge && (
            <div className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm">
              {badge}
            </div>
          )}
          {headline && (
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {headline}
            </h2>
          )}
          {description && (
            <p className="max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
              {description}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {features.map((feature: FeatureItem, i: number) => (
            <FeatureCard key={i} {...feature} />
          ))}
        </div>
        {(primaryActionText || secondaryActionText) && (
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
            {primaryActionText && primaryActionLink && (
              <a
                href={primaryActionLink}
                className="inline-flex h-12 items-center justify-center rounded-full bg-black px-6 font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                {primaryActionText}
              </a>
            )}
            {secondaryActionText && secondaryActionLink && (
              <a
                href={secondaryActionLink}
                className="inline-flex h-12 items-center justify-center rounded-full border border-gray-200 bg-white px-6 font-medium text-black transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900"
              >
                {secondaryActionText}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
)
Features.displayName = 'Features'

export const PricingCard = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & PricingPlan>(
  ({ className, name, price, description, features, ctaText, ctaLink, featured, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col rounded-lg border bg-white shadow-sm dark:bg-gray-950',
        featured ? 'border-black dark:border-white shadow-lg' : 'border-gray-200 dark:border-gray-800',
        className
      )}
      {...props}
    >
      <div className="p-6 space-y-2">
        {featured && (
          <div className="inline-block rounded-full bg-black px-3 py-1 text-sm text-white dark:bg-white dark:text-black mb-2">
            Popular
          </div>
        )}
        <h3 className="text-xl font-bold">{name}</h3>
        {description && <p className="text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <div className="p-6 space-y-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-4xl font-bold">{price}</div>
        <ul className="space-y-2">
          {features.map((feature: string, i: number) => (
            <li key={i} className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-black dark:text-white"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-6 border-t border-gray-200 dark:border-gray-800 mt-auto">
        {ctaText && ctaLink && (
          <a
            href={ctaLink}
            className={cn(
              "inline-flex h-10 w-full items-center justify-center rounded-md px-6 font-medium transition-colors",
              featured 
                ? "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200" 
                : "border border-gray-200 bg-white text-black hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900"
            )}
          >
            {ctaText}
          </a>
        )}
      </div>
    </div>
  )
)
PricingCard.displayName = 'PricingCard'

export const Pricing = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & PricingSection>(
  ({ className, headline, description, plans, note, badge, ...props }, ref) => (
    <section
      ref={ref}
      className={cn('w-full py-12 md:py-24 lg:py-32', className)}
      {...props}
    >
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {badge && (
            <div className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm">
              {badge}
            </div>
          )}
          {headline && (
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {headline}
            </h2>
          )}
          {description && (
            <p className="max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
              {description}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {plans.map((plan: PricingPlan, i: number) => (
            <PricingCard key={i} {...plan} />
          ))}
        </div>
        {note && (
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {note}
          </div>
        )}
      </div>
    </section>
  )
)
Pricing.displayName = 'Pricing'

export const TestimonialCard = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & Testimonial>(
  ({ className, quote, author, authorTitle, authorImageUrl, authorImageAlt, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('h-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950', className)}
      {...props}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-gray-400 mb-4"
          >
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
          </svg>
          <p className="text-lg">{quote}</p>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          {authorImageUrl && (
            <img
              src={authorImageUrl}
              alt={authorImageAlt || author}
              className="rounded-full h-10 w-10 object-cover"
            />
          )}
          <div>
            <p className="font-medium">{author}</p>
            {authorTitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{authorTitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
)
TestimonialCard.displayName = 'TestimonialCard'

export const Testimonials = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & TestimonialsSection>(
  ({ className, headline, description, testimonials, logos, badge, ...props }, ref) => (
    <section
      ref={ref}
      className={cn('w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900', className)}
      {...props}
    >
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {badge && (
            <div className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm">
              {badge}
            </div>
          )}
          {headline && (
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {headline}
            </h2>
          )}
          {description && (
            <p className="max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
              {description}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {testimonials.map((testimonial: Testimonial, i: number) => (
            <TestimonialCard key={i} {...testimonial} />
          ))}
        </div>
        {logos && logos.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-8 mt-12">
            {logos.map((logo: { imageUrl: string; alt?: string }, i: number) => (
              <div key={i} className="h-12">
                <img
                  src={logo.imageUrl}
                  alt={logo.alt || 'Company logo'}
                  className="h-full object-contain opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
)
Testimonials.displayName = 'Testimonials'

export const FAQAccordion = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & FAQItem & { isOpen: boolean; toggleOpen: () => void }>(
  ({ className, question, answer, isOpen, toggleOpen, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-b border-gray-200 dark:border-gray-800', className)}
      {...props}
    >
      <button
        onClick={toggleOpen}
        className="flex w-full items-center justify-between py-4 text-left font-medium transition-all"
      >
        <span>{question}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('h-4 w-4 transition-transform', isOpen ? 'rotate-180' : '')}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div
        className={cn(
          'grid transition-all duration-200',
          isOpen ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <p className="text-gray-500 dark:text-gray-400">{answer}</p>
        </div>
      </div>
    </div>
  )
)
FAQAccordion.displayName = 'FAQAccordion'

export const FAQ = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & FAQSection>(
  ({ className, headline, description, faqs, badge, primaryActionText, primaryActionLink, ...props }, ref) => {
    const [openIndex, setOpenIndex] = React.useState<number | null>(null);
    
    return (
      <section
        ref={ref}
        className={cn('w-full py-12 md:py-24 lg:py-32', className)}
        {...props}
      >
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            {badge && (
              <div className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm">
                {badge}
              </div>
            )}
            {headline && (
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {headline}
              </h2>
            )}
            {description && (
              <p className="max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
                {description}
              </p>
            )}
          </div>
          <div className="mx-auto max-w-3xl mt-8">
            {faqs.map((faq: FAQItem, i: number) => (
              <FAQAccordion 
                key={i} 
                {...faq} 
                isOpen={openIndex === i}
                toggleOpen={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
          {primaryActionText && primaryActionLink && (
            <div className="flex justify-center mt-8">
              <a
                href={primaryActionLink}
                className="inline-flex h-12 items-center justify-center rounded-full bg-black px-6 font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                {primaryActionText}
              </a>
            </div>
          )}
        </div>
      </section>
    )
  }
)
FAQ.displayName = 'FAQ'

export const CallToAction = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & CallToActionSection>(
  ({ className, headline, description, primaryActionText, primaryActionLink, secondaryActionText, secondaryActionLink, badge, ...props }, ref) => (
    <section
      ref={ref}
      className={cn('w-full py-12 md:py-24 lg:py-32 bg-black text-white dark:bg-white dark:text-black', className)}
      {...props}
    >
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {badge && (
            <div className="inline-block rounded-full bg-white/20 px-3 py-1 text-sm text-white dark:bg-black/20 dark:text-black">
              {badge}
            </div>
          )}
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            {headline}
          </h2>
          {description && (
            <p className="max-w-[700px] text-white/80 dark:text-black/80 md:text-xl">
              {description}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <a
              href={primaryActionLink}
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 font-medium text-black transition-colors hover:bg-gray-200 dark:bg-black dark:text-white dark:hover:bg-gray-800"
            >
              {primaryActionText}
            </a>
            {secondaryActionText && secondaryActionLink && (
              <a
                href={secondaryActionLink}
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-transparent px-6 font-medium text-white transition-colors hover:bg-white/10 dark:border-black/20 dark:text-black dark:hover:bg-black/10"
              >
                {secondaryActionText}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
)
CallToAction.displayName = 'CallToAction'

export const TeamMemberCard = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & TeamMember>(
  ({ className, name, role, photoUrl, photoAlt, bio, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950', className)}
      {...props}
    >
      {photoUrl && (
        <div className="aspect-square overflow-hidden">
          <img
            src={photoUrl}
            alt={photoAlt || name}
            className="object-cover w-full h-full transition-transform hover:scale-105"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="font-bold text-lg">{name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
        {bio && (
          <p className="mt-2 text-sm">{bio}</p>
        )}
      </div>
    </div>
  )
)
TeamMemberCard.displayName = 'TeamMemberCard'

export const Team = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & TeamSection>(
  ({ className, headline, description, members, badge, ...props }, ref) => (
    <section
      ref={ref}
      className={cn('w-full py-12 md:py-24 lg:py-32', className)}
      {...props}
    >
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {badge && (
            <div className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm">
              {badge}
            </div>
          )}
          {headline && (
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {headline}
            </h2>
          )}
          {description && (
            <p className="max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
              {description}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          {members.map((member: TeamMember, i: number) => (
            <TeamMemberCard key={i} {...member} />
          ))}
        </div>
      </div>
    </section>
  )
)
Team.displayName = 'Team'
