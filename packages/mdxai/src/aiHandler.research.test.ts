import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { research } from './aiHandler'
import yaml from 'yaml'

vi.mock('./functions/research.js', () => ({
  research: vi.fn().mockResolvedValue({
    text: 'Mock research results',
    markdown: '# Research Results\n\nMock research results with citations [ ¹ ](#1)',
    citations: ['https://example.com/citation1'],
    reasoning: 'This is mock reasoning',
    scrapedCitations: [
      {
        url: 'https://example.com/citation1',
        title: 'Example Citation',
        description: 'This is an example citation',
        markdown: '# Example Content\n\nThis is example content from a citation.'
      }
    ]
  })
}))

describe('research template literal', () => {
  it('should handle template literals with variable interpolation', async () => {
    const market = 'AI tools'
    const idea = 'AI-powered content generation'
    const result = await research`${market} in the context of delivering ${idea}`
    
    const { research: mockedResearch } = await import('./functions/research.js')
    
    expect(mockedResearch).toHaveBeenCalledWith('AI tools in the context of delivering AI-powered content generation')
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('markdown')
    expect(result).toHaveProperty('citations')
    expect(result).toHaveProperty('scrapedCitations')
  })
  
  it('should throw an error when not called as a template literal', () => {
    expect(() => (research as any)('not a template literal')).toThrow('Research function must be called as a template literal')
  })
  
  it('should stringify arrays to YAML format', async () => {
    const competitors = ['Company A', 'Company B', 'Company C']
    const result = await research`Competitors: ${competitors}`
    
    const { research: mockedResearch } = await import('./functions/research.js')
    const expectedYaml = yaml.stringify(competitors)
    
    expect(mockedResearch).toHaveBeenCalledWith(`Competitors: ${expectedYaml}`)
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
        other: '5%'
      }
    }
    
    const result = await research`Market analysis: ${marketData}`
    
    const { research: mockedResearch } = await import('./functions/research.js')
    const expectedYaml = yaml.stringify(marketData)
    
    expect(mockedResearch).toHaveBeenCalledWith(`Market analysis: ${expectedYaml}`)
  })
})
