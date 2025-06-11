import { ResourceObject, RestApiResponse } from '../types/index.js';
import { generateResourceLinks } from '../links/index.js';

export function serializeResource(
  type: string,
  id: string,
  attributes: Record<string, any>,
  baseUrl: string,
  relationships?: Record<string, any>
): ResourceObject {
  return {
    id,
    type,
    attributes,
    relationships: relationships ? mapRelationships(relationships, baseUrl) : undefined,
    links: generateResourceLinks(type, id, baseUrl)
  };
}

function mapRelationships(
  relationships: Record<string, any>,
  baseUrl: string
): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(relationships)) {
    if (Array.isArray(value)) {
      result[key] = {
        data: value.map(item => ({
          id: item.id,
          type: item.type
        })),
        links: {
          self: `${baseUrl}/relationships/${key}`
        }
      };
    } else if (value && typeof value === 'object') {
      result[key] = {
        data: {
          id: value.id,
          type: value.type
        },
        links: {
          self: `${baseUrl}/relationships/${key}`
        }
      };
    }
  }
  
  return result;
}

export function createApiResponse<T>(
  data: T,
  apiInfo: {
    name: string;
    version: string;
    baseUrl: string;
  },
  userInfo: {
    authenticated: boolean;
    username?: string;
    roles?: string[];
    usage: { requests: number; remaining?: number };
    subscription?: { plan: string; expires?: string };
    client?: { ip?: string; userAgent?: string; location?: string };
  }
): RestApiResponse<T> {
  return {
    api: {
      name: apiInfo.name,
      version: apiInfo.version,
      links: {
        home: `${apiInfo.baseUrl}/`,
        root: apiInfo.baseUrl,
        docs: `${apiInfo.baseUrl}/docs`,
        repo: 'https://github.com/mdxld/mdx'
      }
    },
    data,
    links: {
      self: `${apiInfo.baseUrl}/current-path`
    },
    user: {
      auth: {
        authenticated: userInfo.authenticated,
        user: userInfo.username,
        roles: userInfo.roles
      },
      usage: userInfo.usage,
      subscription: userInfo.subscription,
      client: userInfo.client || {}
    }
  };
}
