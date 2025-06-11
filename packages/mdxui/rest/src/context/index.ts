import { convertToJSONLD } from '../../../../mdxld/src/parser.js'

export const defaultApiContext = {
  '@vocab': 'http://mdxld.org/vocab#',
  api: 'http://mdxld.org/vocab#api',
  data: 'http://mdxld.org/vocab#data',
  links: 'http://mdxld.org/vocab#links',
  user: 'http://mdxld.org/vocab#user',
  auth: 'http://mdxld.org/vocab#auth',
  usage: 'http://mdxld.org/vocab#usage',
  subscription: 'http://mdxld.org/vocab#subscription',
  client: 'http://mdxld.org/vocab#client',
  name: 'https://schema.org/name',
  version: 'https://schema.org/version',
  url: 'https://schema.org/url'
};

export function responseToJsonLd(response: any): Record<string, any> {
  const yamlLdFormat = {
    $context: defaultApiContext,
    api: response.api,
    data: response.data,
    links: response.links,
    user: response.user
  };
  
  return convertToJSONLD(yamlLdFormat);
}
