/**
 * Extracts the base content path from a collection pattern
 */
export function extractContentPath(collectionConfig) {
    if (!collectionConfig.pattern) {
        throw new Error(`Pattern for collection is not defined in Velite configuration.`);
    }
    const globPattern = collectionConfig.pattern;
    const basePathParts = typeof globPattern === 'string'
        ? globPattern.split('/')
        : globPattern[0].split('/');
    let contentPath = '';
    for (const part of basePathParts) {
        if (part.includes('*') || part.includes('.')) {
            break;
        }
        contentPath = contentPath ? `${contentPath}/${part}` : part;
    }
    if (!contentPath) {
        throw new Error(`Could not determine base content path from pattern '${globPattern}'.`);
    }
    return contentPath;
}
