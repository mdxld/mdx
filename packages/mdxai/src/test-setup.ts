async function loadEnvironment() {
  if (!process.env.CI) {
    const { config } = await import('dotenv')
    config()
  }

  if (process.env.CI) {
    console.log('CI environment detected')
    const apiKeyPresent = !!process.env.OPENAI_API_KEY
    const gatewayTokenPresent = !!process.env.AI_GATEWAY_TOKEN
    console.log('OPENAI_API_KEY present:', apiKeyPresent)
    console.log('AI_GATEWAY_TOKEN present:', gatewayTokenPresent)
    if (apiKeyPresent) {
      console.log('OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY?.substring(0, 4) + '...')
    }
    if (gatewayTokenPresent) {
      console.log('AI_GATEWAY_TOKEN starts with:', process.env.AI_GATEWAY_TOKEN?.substring(0, 4) + '...')
    }
  }
}

await loadEnvironment()

export {}
