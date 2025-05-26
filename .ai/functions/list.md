# List Function

This function generates a list of items based on the provided prompt. It returns both an array of items and supports async iteration.

## Prompt

The prompt should clearly describe what kind of list you want to generate.

## Response

The function will return an array of items that can be accessed directly or iterated over using async iteration.

## Example

```typescript
// Using as an array
const markets = await list`10 possible market segments for AI-powered content generation`
console.log(markets[0])
// Output: "Digital Marketing Agencies"

// Using async iteration
for await (const market of list`5 market segments for AI tools`) {
  console.log(market)
}
// Output: "Enterprise Software", "Healthcare", etc.
```
