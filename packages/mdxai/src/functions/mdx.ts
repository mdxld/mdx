import { generateText } from 'ai'
import { z } from 'zod'
import { model } from '../ai'
import { parseTemplate, TemplateFunction, createUnifiedFunction } from '../utils/template'
import dedent from 'dedent'

async function mdxCore(prompt: string, options: Record<string, any> = {}): Promise<string> {
  const result = await generateText({
    // model: model('anthropic/claude-opus-4'),
    // model: model('openai/o4-mini-high'),
    model: model('google/gemini-2.5-pro-preview'),
    system: dedent`

      You are an expert developer. You write clean, readable, and well-documented code.  You only respond in MDX format, so you can blend the
      structured data of YAML frontmatter, unstructured content in Github flavored Markdown, import and export as an ES Module, and take
      advantage of the fact that the default export of an MDX file is a React component.

      You always use JSDoc comments to describe any exports, including the Props for the default export component.  For example, if title was a prop, you would write:

      /**
       * @typedef {Object} Props
       * @property {string} title
       */

      /** @type {(props: Props) => JSX.Element} */

      # {props.title}

      If you need to design a component, you don't need to export anything, just write the component.  Use Tailwind CSS for styling, and all Shadcn UI components
      are already imported and available in scope.  For example:

      <Card>
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
          <CardDescription>{props.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{props.content}</p>
        </CardContent>
      </Card>

    `,
    prompt,
  })
  return result.text
}

export const mdx = createUnifiedFunction<Promise<string>>(
  (prompt: string, options: Record<string, any>) => {
    return mdxCore(prompt, options);
  }
);
