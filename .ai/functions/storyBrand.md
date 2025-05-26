# Story Brand Function

This function generates a story brand framework for a business idea based on the provided context.

## Prompt

The function expects an object with the following properties:
- idea: The core business idea
- market: The target market segment
- icp: The ideal customer profile
- marketResearch: Research findings about the market
- leanCanvas: The lean canvas object (optional)

## Response

The function will return a structured story brand object with the following properties:
- name: The brand name
- description: Brief description of the brand
- mission: The brand's mission statement
- values: Core values of the brand
- target_audience: Description of the target audience
- tone: The brand's tone of voice
- key_messages: Array of key brand messages
- status: Publication status

## Example

```typescript
const storyBrand = await ai.storyBrand({
  idea: 'AI-powered content generation',
  market: 'Digital Marketing',
  icp: 'Small business owners',
  marketResearch: 'Market is growing at 15% annually',
  leanCanvas: { /* lean canvas object */ }
})

console.log(storyBrand.name)
// Output: "ContentAI"
```
