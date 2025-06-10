import { renderApp } from '../ui/app.js'

export interface ListResearchOptions {
  output: string
  concurrency: string
}

export async function runListResearchCommand(prompt: string, options: ListResearchOptions) {
  const { json } = getGlobalOptions()
  
  try {
    const unmount = renderApp('list+research', {
      prompt,
      output: options.output,
      concurrency: parseInt(options.concurrency, 10),
    })
  } catch (error) {
    if (json) {
      console.error(JSON.stringify({ status: 'error', message: String(error) }))
    } else {
      console.error('Error during list+research operation:', error)
    }
    process.exit(1)
  }
}

function getGlobalOptions(): { json: boolean } {
  return { json: process.argv.includes('--json') }
}
