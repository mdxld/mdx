import { MdxDbBase } from './base.js'
import { MdxDbConfig, VeliteData } from './types.js'
import micromatch from 'micromatch'

/**
 * Simple in-memory implementation of MdxDbBase for testing
 */
class InMemoryMdxDb extends MdxDbBase {
  constructor(config: MdxDbConfig = {}) {
    super(config)
    this.data = {
      docs: [
        { slug: 'test1', filePath: 'content/test1.md' },
        { slug: 'test2', filePath: 'content/test2.mdx' },
        { slug: 'test3', filePath: 'content/test3.md' },
        { slug: 'test4', filePath: 'content/test4.mdx' },
        { slug: 'readme', filePath: 'README.md', content: '# README\n\nThis is a test readme file.' }
      ]
    }
  }

  async build(): Promise<VeliteData> {
    return this.data as VeliteData
  }

  async watch(): Promise<void> {
  }

  stopWatch(): void {
  }

  /**
   * Override the get method to handle glob patterns correctly
   */
  get(id: string, collectionName?: string, pattern?: string): any | undefined {
    if (!this.data) {
      console.warn('No data loaded. Call build() or ensure watch mode has processed data.')
      return undefined
    }

    if (id.includes('*') || id.includes('?') || id.includes('[') || id.includes('{')) {
      const pattern = id
      
      const collections = collectionName ? 
        (this.data[collectionName] ? [this.data[collectionName]] : []) : 
        Object.values(this.data)
      
      for (const collection of collections) {
        if (Array.isArray(collection)) {
          for (const entry of collection) {
            const matchValue = entry.filePath || 
                             (entry.slug ? `${entry.slug}.mdx` : null) || 
                             '';
            console.log(`Checking if '${matchValue}' matches pattern '${pattern}'`);
            if (micromatch.isMatch(matchValue.toLowerCase(), pattern.toLowerCase())) {
              console.log(`Match found: '${matchValue}' matches '${pattern}'`);
              return entry;
            }
          }
        }
      }
      
      return undefined
    }
    
    return super.get(id, collectionName, pattern)
  }

  async set(id: string, content: any, collectionName: string): Promise<void> {
    if (!this.data) {
      this.data = {}
    }
    
    if (!this.data[collectionName]) {
      this.data[collectionName] = []
    }
    
    const existingIndex = this.data[collectionName].findIndex((item: any) => item.slug === id)
    
    if (existingIndex >= 0) {
      this.data[collectionName][existingIndex] = { ...content, slug: id }
    } else {
      this.data[collectionName].push({ ...content, slug: id })
    }
  }

  async delete(id: string, collectionName: string): Promise<boolean> {
    if (!this.data || !this.data[collectionName]) {
      return false
    }
    
    const initialLength = this.data[collectionName].length
    this.data[collectionName] = this.data[collectionName].filter((item: any) => item.slug !== id)
    
    return initialLength !== this.data[collectionName].length
  }
}

export const db = new InMemoryMdxDb()
