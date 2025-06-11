import { experiment, experimentWithRatings } from '../src/index.js'

async function basicExample() {
  const mockAiFunction = async (options: any) => {
    if (options.model === 'gpt-4') {
      return 'This is a high-quality, detailed response with comprehensive analysis and thorough explanations.'
    }
    return 'Basic response.'
  }

  console.log('Running basic experiment without ratings...')
  const basicResult = await experiment('Basic test', {
    model: ['gpt-4', 'gpt-3.5'],
    temperature: [0.3, 0.7]
  }, mockAiFunction)

  console.log('Basic experiment results:', basicResult.results.length, 'combinations tested')

  console.log('\nRunning experiment with Elo ratings...')
  const ratedResult = await experimentWithRatings('Rated test', {
    model: ['gpt-4', 'gpt-3.5'],
    temperature: [0.3, 0.7]
  }, mockAiFunction, {
    type: 'numeric',
    metric: 'length'
  })

  console.log('Rated experiment results:')
  console.log('- Evaluations:', ratedResult.evaluations?.length)
  console.log('- Parameter ratings:', ratedResult.ratings?.parameters.length)
  console.log('- Combination ratings:', ratedResult.ratings?.combinations.length)

  if (ratedResult.ratings?.parameters) {
    console.log('\nParameter ratings:')
    for (const param of ratedResult.ratings.parameters) {
      const winRate = param.rating.matches > 0 ? (param.rating.wins / param.rating.matches * 100).toFixed(1) : '0.0'
      console.log(`- ${param.parameterType}: ${JSON.stringify(param.parameterValue)} - Rating: ${param.rating.rating.toFixed(0)}, Win Rate: ${winRate}%`)
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  basicExample().catch(console.error)
}
