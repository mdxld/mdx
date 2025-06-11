import { HateoasLinks } from '../types/index.js';

export function generateResourceLinks(
  resourceType: string,
  resourceId: string,
  baseUrl: string
): HateoasLinks {
  return {
    self: `${baseUrl}/${resourceType}/${resourceId}`,
    collection: `${baseUrl}/${resourceType}`
  };
}

export function generatePaginationLinks(
  resourceType: string,
  baseUrl: string,
  page: number,
  totalPages: number
): HateoasLinks {
  const links: HateoasLinks = {
    self: `${baseUrl}/${resourceType}?page=${page}`
  };
  
  if (totalPages > 1) {
    links.first = `${baseUrl}/${resourceType}?page=1`;
    links.last = `${baseUrl}/${resourceType}?page=${totalPages}`;
    
    if (page > 1) {
      links.prev = `${baseUrl}/${resourceType}?page=${page - 1}`;
    }
    
    if (page < totalPages) {
      links.next = `${baseUrl}/${resourceType}?page=${page + 1}`;
    }
  }
  
  return links;
}
