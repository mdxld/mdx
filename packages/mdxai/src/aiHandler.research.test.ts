import { describe, expect, it, vi } from 'vitest'
import { research } from './aiHandler'
import yaml from 'yaml'
import * as researchModule from './functions/research.js'

describe('research template literal', () => {
  it('should handle template literals with variable interpolation', async () => {
    const market = 'AI tools'
    const idea = 'AI-powered content generation'
    
    const researchSpy = vi.spyOn(researchModule, 'research')
    
    const result = await research`${market} in the context of delivering ${idea}`

    expect(researchSpy).toHaveBeenCalledWith('AI tools in the context of delivering AI-powered content generation')
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('markdown')
    expect(result).toHaveProperty('citations')
    expect(result).toHaveProperty('scrapedCitations')
    
    researchSpy.mockRestore()
  })

  it('should throw an error when not called as a template literal', () => {
    expect(() => (research as any)('not a template literal')).toThrow('Research function must be called as a template literal')
  })

  it('should stringify arrays to YAML format', async () => {
    const competitors = ['Company A', 'Company B', 'Company C']
    
    const researchSpy = vi.spyOn(researchModule, 'research')
    
    const result = await research`Competitors: ${competitors}`

    const expectedYaml = yaml.stringify(competitors)
    expect(researchSpy).toHaveBeenCalledWith(`Competitors: ${expectedYaml}`)
    
    researchSpy.mockRestore()
  })

  it('should stringify objects to YAML format', async () => {
    const marketData = {
      size: '$5 billion',
      growth: '12% annually',
      topPlayers: ['Company X', 'Company Y', 'Company Z'],
      regions: {
        northAmerica: '40%',
        europe: '30%',
        asia: '25%',
        other: '5%',
      },
    }
    
    const researchSpy = vi.spyOn(researchModule, 'research')

    const result = await research`Market analysis: ${marketData}`

    const expectedYaml = yaml.stringify(marketData)
    expect(researchSpy).toHaveBeenCalledWith(`Market analysis: ${expectedYaml}`)
    
    researchSpy.mockRestore()
  })
})
