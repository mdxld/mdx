import { generateText } from 'ai'
import { createAIModel } from '../ai.js'
import { parseTemplate, createUnifiedFunction } from '../utils/template.js'

interface MdxOptions {
  apiKey?: string
  baseURL?: string
  model?: string
  includeComponents?: boolean
  frontmatter?: Record<string, any>
}

async function mdxCore(prompt: string, options: MdxOptions = {}): Promise<string> {
  const selectedModel = options.model || 'google/gemini-2.5-flash-preview-05-20'
  const aiModel = createAIModel(options.apiKey, options.baseURL)

  const {
    includeComponents = true,
    frontmatter = {}
  } = options

  let systemPrompt = 'Generate MDX content with proper markdown syntax and JSX components.'
  
  if (includeComponents) {
    systemPrompt += ' Include interactive React components where appropriate.'
  }

  if (Object.keys(frontmatter).length > 0) {
    systemPrompt += ' Include YAML frontmatter with the provided metadata.'
  }

  const result = await generateText({
    model: aiModel(selectedModel),
    system: systemPrompt,
    prompt: `Generate MDX content for: ${prompt}`,
  })

  let mdxContent = result.text

  if (Object.keys(frontmatter).length > 0) {
    const frontmatterYaml = Object.entries(frontmatter)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n')
    
    mdxContent = `---\n${frontmatterYaml}\n---\n\n${mdxContent}`
  }

  return mdxContent
}

export const mdx = createUnifiedFunction<Promise<string>>(
  (prompt: string, options: Record<string, any>) => {
    return mdxCore(prompt, options as MdxOptions);
  }
);
