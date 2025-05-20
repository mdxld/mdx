import { parse } from 'yaml';

export interface ParseFrontmatterResult {
  frontmatter: Record<string, any> | null;
  error?: string;
}

export function parseFrontmatter(mdxContent: string): ParseFrontmatterResult {
  const frontmatterRegex = /^\s*---([\s\S]*?)---/;
  const match = mdxContent.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: null, error: 'Frontmatter not found' };
  }

  const yamlContent = match[1];

  try {
    const frontmatter = parse(yamlContent);
    if (frontmatter === null || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
      // YAML can parse to null, string, number, boolean, array, or object.
      // We require a non-null object for frontmatter.
      return { 
        frontmatter: null, 
        error: 'MDXLD Invalid Frontmatter: Frontmatter must be a YAML object (key-value pairs).' 
      };
    }
    return { frontmatter: frontmatter as Record<string, any> };
  } catch (e: any) {
    // The 'yaml' library throws YAMLError, which has a 'message' property.
    return { frontmatter: null, error: `MDXLD YAML Parsing Error: ${e.message}` };
  }
}

// Helper function to recursively transform keys
function transformNode(node: any): any {
  if (Array.isArray(node)) {
    return node.map(transformNode);
  }
  if (typeof node === 'object' && node !== null) {
    const newNode: Record<string, any> = {};
    for (const key in node) {
      let newKey = key;
      if (key === '$id') newKey = '@id';
      else if (key === '$type') newKey = '@type';
      // $context is handled at the top level, not recursively for nodes within a graph

      newNode[newKey] = transformNode(node[key]);
    }
    return newNode;
  }
  return node;
}

export function convertToJSONLD(yamlObject: Record<string, any> | null): Record<string, any> {
  if (!yamlObject || Object.keys(yamlObject).length === 0) {
    return { "@graph": [] }; // Handle empty or null input
  }

  const jsonld: Record<string, any> = {};
  let processedInput = { ...yamlObject };

  // Handle top-level $context
  if (processedInput.hasOwnProperty('$context')) {
    const contextValue = processedInput['$context'];
    if (
      typeof contextValue !== 'string' &&
      (typeof contextValue !== 'object' || contextValue === null) &&
      !Array.isArray(contextValue)
    ) {
      throw new TypeError(
        "MDXLD Invalid $context: '$context' must be a string, object, or array."
      );
    }
    jsonld['@context'] = transformNode(contextValue);
    delete processedInput['$context']; // Remove from further processing
  }

  // Handle $graph
  if (processedInput.hasOwnProperty('$graph') && Array.isArray(processedInput['$graph'])) {
    jsonld['@graph'] = processedInput['$graph'].map(transformNode);
    // If there are other keys alongside $graph and $context, they are ignored as per typical JSON-LD with @graph.
    // Or, decide if they should be part of the main node description if @graph is not exclusive.
    // For now, assuming $graph, if present, defines the graph content exclusively (besides @context).
  } else {
    // No $graph, so the entire (remaining) object becomes a single node in the @graph array
    jsonld['@graph'] = [transformNode(processedInput)];
  }

  return jsonld;
}
