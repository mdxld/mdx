import { MdxDbInterface, DocumentContent, CollectionInterface } from './types.js'

/**
 * Collection wrapper that provides convenient methods for a specific collection
 */
export class Collection implements CollectionInterface {
  constructor(
    private db: MdxDbInterface,
    private collectionName: string
  ) {}

  /**
   * Create a new document in this collection
   */
  async create(title: string, content: string): Promise<void> {
    const slug = this.generateSlug(title)
    const documentContent: DocumentContent = {
      frontmatter: { title },
      body: content.trim()
    }
    await this.db.set(slug, documentContent, this.collectionName)
  }

  /**
   * Get a document by ID, slug, or title from this collection
   * 
   * This method will:
   * 1. Try to find by exact ID/slug match
   * 2. Try to find by exact title match
   * 3. Try to find by case-insensitive title match
   * 4. Try to find by slugified title
   */
  get(idOrTitle: string): any | undefined {
    let result = this.db.get(idOrTitle, this.collectionName)
    
    if (!result) {
      // Get all items in the collection
      const allItems = this.db.list(this.collectionName) || []
      console.log(`Collection.get: Looking for "${idOrTitle}" in ${allItems.length} items`)
      
      // Try exact title match
      const normalizedInput = String(idOrTitle).trim()
      for (const item of allItems) {
        if (item && typeof item === 'object' && item.title) {
          const itemTitle = String(item.title).trim()
          console.log(`Comparing: "${itemTitle}" === "${normalizedInput}"`)
          if (itemTitle === normalizedInput) {
            console.log(`Found exact title match: ${itemTitle}`)
            result = item
            break
          }
        }
      }
      
      if (!result) {
        const lowerInput = normalizedInput.toLowerCase()
        for (const item of allItems) {
          if (item && typeof item === 'object' && item.title) {
            const itemTitle = String(item.title).trim().toLowerCase()
            if (itemTitle === lowerInput) {
              console.log(`Found case-insensitive title match: ${item.title}`)
              result = item
              break
            }
          }
        }
      }
      
      if (!result && idOrTitle.match(/[A-Z\s]/)) {
        const slug = this.generateSlug(idOrTitle)
        console.log(`Trying slugified match: "${slug}"`)
        result = this.db.get(slug, this.collectionName)
        if (result) {
          console.log(`Found by slugified title: ${result.title}`)
        }
      }
    }
    
    return result
  }

  /**
   * List all documents in this collection
   */
  list(): any[] {
    return this.db.list(this.collectionName)
  }

  /**
   * Update an existing document in this collection
   */
  async update(id: string, title: string, content: string): Promise<void> {
    const documentContent: DocumentContent = {
      frontmatter: { title },
      body: content.trim()
    }
    await this.db.set(id, documentContent, this.collectionName)
  }

  /**
   * Delete a document from this collection
   */
  async delete(id: string): Promise<boolean> {
    return this.db.delete(id, this.collectionName)
  }

  /**
   * Generate a slug from a title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
