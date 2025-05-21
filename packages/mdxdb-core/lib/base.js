/**
 * Abstract base class for MdxDb implementations
 */
export class MdxDbBase {
    data = null;
    config;
    constructor(config = {}) {
        this.config = config.veliteConfig || {};
    }
    /**
     * Lists documents from a collection or all collections
     */
    list(collectionName) {
        if (!this.data) {
            console.warn('No data loaded. Call build() or ensure watch mode has processed data.');
            return [];
        }
        if (collectionName) {
            if (this.data[collectionName]) {
                return this.data[collectionName];
            }
            else {
                console.warn(`Collection '${collectionName}' not found.`);
                return [];
            }
        }
        else {
            let allEntries = [];
            for (const key in this.data) {
                if (Array.isArray(this.data[key])) {
                    allEntries = allEntries.concat(this.data[key]);
                }
            }
            return allEntries;
        }
    }
    /**
     * Gets the current database data or a specific document
     */
    getData(id, collectionName) {
        if (id && collectionName) {
            return this.get(id, collectionName);
        }
        else if (id) {
            return this.get(id);
        }
        return this.data;
    }
    /**
     * Gets a document by ID
     */
    get(id, collectionName) {
        if (!this.data) {
            console.warn('No data loaded. Call build() or ensure watch mode has processed data.');
            return undefined;
        }
        if (collectionName) {
            const collection = this.data[collectionName];
            if (collection && Array.isArray(collection)) {
                return collection.find(entry => entry.slug === id);
            }
            else {
                console.warn(`Collection '${collectionName}' not found or is not an array.`);
                return undefined;
            }
        }
        else {
            for (const key in this.data) {
                const collection = this.data[key];
                if (Array.isArray(collection)) {
                    const foundEntry = collection.find(entry => entry.slug === id);
                    if (foundEntry) {
                        return foundEntry;
                    }
                }
            }
            return undefined; // Not found in any collection
        }
    }
    /**
     * Gets all documents from a collection
     */
    getCollection(name) {
        return this.data?.[name];
    }
    /**
     * Search for documents using vector embeddings (optional)
     * Default implementation returns empty array
     */
    async search(query, collectionName) {
        console.warn('Search not implemented in this database implementation');
        return [];
    }
}
