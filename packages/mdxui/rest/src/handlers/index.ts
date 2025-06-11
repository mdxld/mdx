import { createApiResponse } from '../serializers/index.js';
import { responseToJsonLd } from '../context/index.js';

export function createRestHandler(config: {
  apiName: string;
  apiVersion: string;
  baseUrl: string;
}) {
  return {
    handleRequest: async (
      resourceType: string,
      resourceId?: string,
      query?: Record<string, any>,
      userInfo?: any
    ) => {
      const data = { message: 'Resource data would be here' };
      
      const response = createApiResponse(
        data,
        {
          name: config.apiName,
          version: config.apiVersion,
          baseUrl: config.baseUrl
        },
        userInfo || {
          authenticated: false,
          usage: { requests: 1 }
        }
      );
      
      const acceptHeader = 'application/json';
      if (acceptHeader.includes('application/ld+json')) {
        return responseToJsonLd(response);
      }
      
      return response;
    }
  };
}
