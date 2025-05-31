# Landing Page Function

This function generates a landing page structure for a business idea based on the provided context.

## Prompt

The function expects an object with the following properties:
- idea: The core business idea
- market: The target market segment
- icp: The ideal customer profile
- marketResearch: Research findings about the market
- leanCanvas: The lean canvas object (optional)
- storyBrand: The story brand object (optional)

## Response

The function will return a structured landing page object with the following properties:
- headline: The main headline for the landing page
- subheadline: The supporting subheadline
- features: Array of key features
- cta: Call to action text

## Example

```typescript
const landingPage = await ai.landingPage({
  idea: 'AI-powered content generation',
  market: 'Digital Marketing',
  icp: 'Small business owners',
  marketResearch: 'Market is growing at 15% annually',
  leanCanvas: { /* lean canvas object */ },
  storyBrand: { /* story brand object */ }
})

console.log(landingPage.headline)
// Output: "Create Better Content 10x Faster with AI"
```
