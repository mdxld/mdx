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
      
      const normalizedInput = String(idOrTitle).trim();
      result = allItems.find(item => 
        item && 
        typeof item === 'object' && 
        item.title && 
        String(item.title).trim() === normalizedInput
      );
      
      if (!result) {
        const lowerInput = normalizedInput.toLowerCase();
        result = allItems.find(item => 
          item && 
          typeof item === 'object' && 
          item.title && 
          String(item.title).trim().toLowerCase() === lowerInput
        );
      }
      
      // If still not found and input has uppercase or spaces, try slugifying
      if (!result && idOrTitle.match(/[A-Z\s]/)) {
        const slug = this.generateSlug(idOrTitle);
        result = this.db.get(slug, this.collectionName);
      }
    }
    
    return result;
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
