import 'dotenv/config'

if (process.env.CI) {
  console.log('CI environment detected')
  console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY)
  console.log('AI_GATEWAY_TOKEN present:', !!process.env.AI_GATEWAY_TOKEN)
}
