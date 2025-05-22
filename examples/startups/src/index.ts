import * as ideas from 'ideas-example/ideas'

console.log('🚀 AI Agent Ideas for Startups:')
console.log('==============================\n')

Object.entries(ideas).forEach(([key, idea], index) => {
  console.log(`Idea #${index + 1}: ${idea.title}`)
  console.log(`Description: ${idea.description}`)
  console.log('Capabilities:')
  idea.capabilities.forEach((capability: string) => {
    console.log(`  - ${capability}`)
  })
  console.log(`Complexity: ${idea.complexity}`)
  console.log('Use Cases:')
  idea.use_cases.forEach((useCase: string) => {
    console.log(`  - ${useCase}`)
  })
  console.log('\n')
})

console.log('These AI agent ideas can be expanded into full startups with the right implementation strategy!')
