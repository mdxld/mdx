---
$type: Slides
---

# Dynamic Pitch Deck Generator with AI

This example demonstrates how to create a dynamic pitch deck using MDX, Reveal.js, and AI-powered content generation. The pitch deck content is generated based on a startup idea input by the user, leveraging the mdxai package for intelligent content creation.

## Features

- Multi-step workflow with guided user input
- AI-powered content generation using mdxai
- Dynamic generation of pitch deck content
- Complete slide deck with all standard pitch deck components:
  - Title Slide
  - Problem
  - Solution
  - Product Overview
  - Market Opportunity
  - Business Model
  - Competition
  - Traction & Milestones
  - Financials & Ask
  - Team
  - Closing

## Prerequisites

This example requires an OpenAI API key to generate content. Set up your environment variable:

```bash
# Set your OpenAI API key as an environment variable
export OPENAI_API_KEY=your-api-key-here
```

## Running the Example

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

## Workflow Steps

The example implements a complete workflow with the following steps:

1. **Initial Idea Input**

   - Collect the startup idea, industry, and target market
   - This information forms the foundation for all generated content

2. **Market Analysis**

   - AI-generated problem statement and supporting statistics
   - Market size estimation and segmentation
   - Growth projections for the industry

3. **Solution Definition**

   - AI-generated solution statement and value propositions
   - Product description and key features
   - Unique selling points

4. **Business Model**

   - Revenue model and pricing strategy
   - Go-to-market approach
   - Competitive analysis and advantages

5. **Pitch Deck Generation**
   - Complete pitch deck with all standard components
   - Dynamically rendered slides using @mdxui/reveal
   - Consistent branding and messaging throughout

## How It Works

The example uses:

1. **Workflow Frontmatter**: Defines the multi-step workflow structure with input/output schemas
2. **mdxai Integration**: Uses the `ai` template literal syntax for content generation
3. **@mdxui/reveal**: Provides the slide presentation framework
4. **React State Management**: Manages workflow state and user input

### AI Integration

The example implements a wrapper around the mdxai package that supports three main patterns:

```jsx
// Generate a single piece of content
const tagline = await ai.generate(`Create a tagline for ${companyName}`)

// Generate a list of items
const features = await ai.list`4 key features for a product focused on ${idea}`

// Use template literals directly
const description = await ai`Describe a product that solves ${problem}`
```

## Customization

You can customize the pitch deck generator by modifying:

- **Workflow Steps**: Edit the frontmatter to change the workflow structure
- **AI Prompts**: Modify the prompts in each step to generate different content
- **Slide Templates**: Adjust the DynamicPitchDeck component to change slide layouts
- **Styling**: Customize the appearance using mdxui components

## Fallback Mechanism

The example includes fallback content generation in case the AI service is unavailable or the API key is not set. This ensures the example can still be demonstrated without an active API connection.

## Learn More

- [MDX Documentation](https://mdxjs.com/)
- [Reveal.js Documentation](https://revealjs.com/)
- [MDXE Documentation](https://github.com/mdxld/mdx/tree/main/packages/mdxe)
- [MDXAI Documentation](https://github.com/mdxld/mdx/tree/main/packages/mdxai)
