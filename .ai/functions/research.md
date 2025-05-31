# Research Function

This function performs research on a given topic and returns structured results with citations.

## Prompt

The prompt should be a clear research question or topic.

## Response

The function will return an object with the following properties:
- text: The main research findings as plain text
- markdown: The research findings formatted in markdown with citations
- citations: An array of citation URLs
- reasoning: The reasoning behind the research findings
- scrapedCitations: An array of objects containing detailed citation information

## Example

```typescript
const research = await research`Market trends for AI-powered content generation`
console.log(research.markdown)
// Output: # Market Trends for AI-Powered Content Generation
// 
// The market for AI-powered content generation is growing rapidly [ ¹ ](#1)...
```
