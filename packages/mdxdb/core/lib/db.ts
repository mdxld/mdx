import { MdxDbBase } from './base.js'
import { MdxDbConfig, VeliteData } from './types.js'

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
        { slug: 'readme', filePath: 'README.md' }
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
