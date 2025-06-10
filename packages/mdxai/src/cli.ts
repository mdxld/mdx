import { Command } from 'commander'
import packageJson from '../package.json' with { type: 'json' }
import { runGenerateCommand } from './commands/generate.js'
import { runEditCommand } from './commands/edit.js'
import { runListCommand } from './commands/list.js'
import { runResearchCommand } from './commands/research.js'
import { runDeepwikiCommand } from './commands/deepwiki.js'
import { runSayCommand } from './commands/say.js'
import { runListGenerateCommand } from './commands/list-generate.js'
import { runListResearchCommand } from './commands/list-research.js'

const program = new Command()

program
  .version(packageJson.version)
  .description('A CLI tool for MDX AI')
  .option('--json', 'Emit JSON describing actions/results')
  .option('--concurrency <number>', 'Maximum number of concurrent operations for batch commands', '20')

program
  .command('generate <prompt>')
  .option('-o, --output <filepath>', 'Specify output file path')
  .option('-t, --type <contenttype>', 'Specify content type (e.g., title, outline, draft)', 'draft')
  .option('--ink', 'Use React Ink for interactive UI', false)
  .action(async (prompt: string, options: { output?: string; type: string; ink: boolean }) => {
    await runGenerateCommand(prompt, options)
  })

program
  .command('edit <filepath> <instruction>')
  .option('-o, --output <newfilepath>', 'Specify output file path for the edited content. If not provided, the original file will be modified in-place.')
  .action(async (filepath: string, instruction: string, options: { output?: string }) => {
    await runEditCommand(filepath, instruction, options)
  })

program
  .command('list <prompt>')
  .option('-o, --output <filepath>', 'Specify output file path', 'index.mdx')
  .option('-f, --format <format>', 'Specify output format (markdown, frontmatter, both)', 'markdown')
  .option('--ink', 'Use React Ink for interactive UI', false)
  .action(async (prompt: string, options: { output: string; format: string; ink: boolean }) => {
    await runListCommand(prompt, options)
  })

program
  .command('research <prompt>')
  .option('-o, --output <filepath>', 'Specify output file path', 'research.mdx')
  .option('-f, --format <format>', 'Specify output format (markdown, frontmatter, both)', 'markdown')
  .option('--ink', 'Use React Ink for interactive UI', false)
  .action(async (prompt: string, options: { output: string; format: string; ink: boolean }) => {
    await runResearchCommand(prompt, options)
  })

program
  .command('deepwiki <query>')
  .description('Generate a markdown research document and save it to research/{title}.md')
  .action(async (query: string) => {
    await runDeepwikiCommand(query)
  })

program
  .command('list+generate <prompt>')
  .description('Generate a list of items and then generate content for each item')
  .option('-o, --output <filepath>', 'Specify output file path', 'generated.mdx')
  .option('--concurrency <number>', 'Maximum number of concurrent operations', '20')
  .action(async (prompt: string, options: { output: string; concurrency: string }) => {
    await runListGenerateCommand(prompt, options)
  })

program
  .command('list+research <prompt>')
  .description('Generate a list of topics and then research each topic')
  .option('-o, --output <filepath>', 'Specify output file path', 'research.mdx')
  .option('--concurrency <number>', 'Maximum number of concurrent operations', '20')
  .action(async (prompt: string, options: { output: string; concurrency: string }) => {
    await runListResearchCommand(prompt, options)
  })

program
  .command('say <text>')
  .description('Generate speech audio from text and play it')
  .option('-o, --output <filepath>', 'Specify output file path for the audio')
  .option('-v, --voice <voice>', 'Specify the voice to use', 'Kore')
  .option('-p, --play', 'Play the audio after generating it', true)
  .action(async (text: string, options: { output?: string; voice: string; play: boolean }) => {
    await runSayCommand(text, options)
  })

export { program }

if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse(process.argv)
}
