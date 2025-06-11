/**
 * Occupation processor for Services-as-Software generation
 * Processes occupation data and triggers recursive idea generation
 */

import { emit, MutableEventContext } from './event-system'
import fs from 'fs/promises'
import path from 'path'

/**
 * Process occupations and trigger the occupation.analyzed event
 */
export async function processOccupations() {
  console.log('Starting Services-as-Software occupation processing...')
  
  try {
    const outputDir = path.resolve('output/services-as-software')
    await fs.mkdir(outputDir, { recursive: true })
    console.log(`Created output directory: ${outputDir}`)
    
    const { createExecutionContext } = await import('./execution-context.js')
    const context = createExecutionContext()
    
    console.log('Registering occupation.analyzed event handler...')
    context.on('occupation.analyzed', (data, eventContext) => {
      console.log('Handler executed with data:', data?.length || 0, 'occupations')
      return data
    })
    
    console.log('Triggering occupation.analyzed event...')
    const result = await emit('occupation.analyzed', {}, new MutableEventContext({
      eventType: 'occupation.analyzed',
      timestamp: new Date().toISOString(),
      initiator: 'processOccupations'
    }))
    
    console.log('Occupation processing complete.')
    console.log(`Results: ${result.results?.length || 0} handlers executed`)
    console.log('Check output/services-as-software/ directory for generated ideas.')
    
    return result
  } catch (error) {
    console.error('Error in processOccupations:', error)
    throw error
  }
}

/**
 * Save a generated idea to the output directory
 */
export function saveGeneratedIdea(idea: any): string {
  const outputDir = path.resolve('output/services-as-software')
  const fileName = `${idea.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}.json`
  const filePath = path.join(outputDir, fileName)
  
  return filePath
}
