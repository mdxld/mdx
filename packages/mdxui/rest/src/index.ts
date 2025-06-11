export * from './types/index.js';
export * from './serializers/index.js';
export * from './links/index.js';
export * from './context/index.js';
export * from './handlers/index.js';

import { createRestHandler } from './handlers/index.js';

export const RestApi = createRestHandler({
  apiName: 'MDXUI REST API',
  apiVersion: '1.0.0',
  baseUrl: 'https://api.mdxui.org'
});
