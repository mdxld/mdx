# Lean Canvas Function

This function generates a lean canvas for a business idea based on the provided context.

## Prompt

The function expects an object with the following properties:
- idea: The core business idea
- market: The target market segment
- icp: The ideal customer profile
- marketResearch: Research findings about the market

## Response

The function will return a structured lean canvas object with the following properties:
- problem: The problem being solved
- solution: The proposed solution
- uniqueValueProposition: The unique value proposition
- customerSegments: Array of customer segments
- channels: Array of distribution channels
- revenue: Revenue streams
- costs: Cost structure

## Example

```typescript
const leanCanvas = await ai.leanCanvas({
  idea: 'AI-powered content generation',
  market: 'Digital Marketing',
  icp: 'Small business owners',
  marketResearch: 'Market is growing at 15% annually'
})

console.log(leanCanvas.uniqueValueProposition)
// Output: "Save time and improve quality with AI-generated content"
```
