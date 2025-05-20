# `mdxai` - Generate & Edit Markdown & MDX

`mdxai` is a command line tool and library for AI-assisted content creation. It leverages large language models to generate new Markdown/MDX files or edit existing ones based on natural language prompts. The package is designed to work hand in hand with the rest of the `mdx*` ecosystem, providing a streamlined workflow for authoring rich documents.

## Features

- Prompt-driven generation of Markdown and MDX content.
- Editing commands to refactor or extend existing files.
- Pluggable model backends so you can use the LLM provider of your choice.
- Can integrate with `mdxdb` for storage and querying of generated content.

## Example

```bash
mdxai generate 100 blog post titles about the future of work post-AGI
```

Use `--json` to receive structured output:

```bash
mdxai generate "A short poem" --json
```

Example response:

```json
{
  "status": "success",
  "content": "...generated text..."
}
```
