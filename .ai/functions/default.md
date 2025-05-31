# Default AI Function

This function is the default AI function that is called when no specific function is specified. It generates text based on the provided prompt.

## Prompt

The prompt should be a clear instruction for what kind of text you want to generate.

## Response

The function will return generated text based on the prompt.

## Example

```typescript
const text = await ai`Generate a short paragraph about artificial intelligence.`
console.log(text)
// Output: Artificial intelligence represents a transformative technology that mimics human cognitive functions...
```
