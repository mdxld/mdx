import { experimentWithRatings, generateOptimalConfig, evolveConfigurations, generateConfigurationReport } from '../src/index.js'

async function evolutionExample() {
  const mockAiFunction = async (options: any) => {
    let score = 50
    
    if (options.model === 'gpt-4') score += 30
    if (options.temperature === 0.7) score += 15
    if (options.prompt === 'detailed') score += 10
    
    const noise = Math.random() * 20 - 10
    score += noise
    
    return `Response with quality score: ${score.toFixed(1)}`
  }

  const baseConfig = {
    model: ['gpt-4', 'gpt-3.5', 'claude-3'],
    temperature: [0.3, 0.7, 1.0],
    prompt: ['brief', 'detailed', 'creative']
  }

  console.log('Running multiple experiments to build rating history...')
  
  for (let i = 0; i < 3; i++) {
    console.log(`\nExperiment ${i + 1}/3`)
    
    const result = await experimentWithRatings(`Evolution experiment ${i + 1}`, baseConfig, mockAiFunction, {
      type: 'custom',
      compareFn: (resultA: any, resultB: any) => {
        const scoreA = parseFloat(resultA.match(/score: ([\d.]+)/)?.[1] || '0')
        const scoreB = parseFloat(resultB.match(/score: ([\d.]+)/)?.[1] || '0')
        
        if (scoreA > scoreB) return 'win'
        if (scoreA < scoreB) return 'loss'
        return 'draw'
      }
    })
    
    console.log(`- Tested ${result.results.length} combinations`)
    console.log(`- Generated ${result.evaluations?.length} evaluations`)
  }

  console.log('\nGenerating optimal configuration...')
  const optimalConfig = await generateOptimalConfig(['model', 'temperature', 'prompt'])
  console.log('Optimal config:', optimalConfig)

  console.log('\nEvolving new configurations...')
  const evolved = await evolveConfigurations(baseConfig, {
    populationSize: 8,
    mutationRate: 0.2,
    crossoverRate: 0.8,
    eliteCount: 2
  })
  
  console.log('Evolved configurations:')
  evolved.forEach((config, i) => {
    console.log(`${i + 1}. ${JSON.stringify(config)}`)
  })

  console.log('\nGenerating configuration report...')
  const report = await generateConfigurationReport()
  console.log(report)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  evolutionExample().catch(console.error)
}
