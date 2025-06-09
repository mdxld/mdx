async function loadEnvironment() {
  try {
    const { config } = await import('dotenv')
    config()
  } catch (error) {
  }

  const isCI = !!(process.env.CI || process.env.GITHUB_ACTIONS || process.env.CONTINUOUS_INTEGRATION)
  const apiKeyPresent = !!process.env.OPENAI_API_KEY
  const gatewayTokenPresent = !!process.env.AI_GATEWAY_TOKEN
  
  console.log('Environment debug:')
  console.log('- CI detected:', isCI)
  console.log('- process.env.CI:', process.env.CI)
  console.log('- process.env.GITHUB_ACTIONS:', process.env.GITHUB_ACTIONS)
  console.log('- OPENAI_API_KEY present:', apiKeyPresent)
  console.log('- AI_GATEWAY_TOKEN present:', gatewayTokenPresent)
  
  if (apiKeyPresent) {
    console.log('- OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY?.substring(0, 4) + '...')
  }
  if (gatewayTokenPresent) {
    console.log('- AI_GATEWAY_TOKEN starts with:', process.env.AI_GATEWAY_TOKEN?.substring(0, 4) + '...')
  }
}

await loadEnvironment()

export {}
