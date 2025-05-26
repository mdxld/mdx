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
   * Get a document by ID from this collection
   */
  get(id: string): any | undefined {
    return this.db.get(id, this.collectionName)
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
