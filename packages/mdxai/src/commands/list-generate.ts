import { renderApp } from '../ui/app.js'

export interface ListGenerateOptions {
  output: string
  concurrency: string
}

export async function runListGenerateCommand(prompt: string, options: ListGenerateOptions) {
  const { json } = getGlobalOptions()
  
  try {
    const unmount = renderApp('list+generate', {
      prompt,
      output: options.output,
      concurrency: parseInt(options.concurrency, 10),
    })
  } catch (error) {
    if (json) {
      console.error(JSON.stringify({ status: 'error', message: String(error) }))
    } else {
      console.error('Error during list+generate operation:', error)
    }
    process.exit(1)
  }
}

function getGlobalOptions(): { json: boolean } {
  return { json: process.argv.includes('--json') }
}
