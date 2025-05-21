import https from 'https';
import fs from 'fs/promises';
import path from 'path';

/**
 * Fetches Schema.org JSON-LD data from the latest version
 */
async function fetchSchemaOrgJsonLd(): Promise<any> {
  const url = 'https://schema.org/version/latest/schemaorg-current-https.jsonld';
  
  return new Promise<any>((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        const location = response.headers['location'] || response.headers['content-location'];
        
        if (location) {
          console.log(`Handling redirect to ${location}...`);
          https.get(location, handleResponse).on('error', reject);
          return;
        }
        
        reject(new Error(`Failed to fetch Schema.org data: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      handleResponse(response);
    }).on('error', reject);
    
    function handleResponse(response: any) {
      const data: string[] = [];
      
      response.on('data', (chunk: Buffer) => {
        data.push(chunk.toString('utf-8'));
      });
      
      response.on('end', () => {
        try {
          const jsonld = JSON.parse(data.join(''));
          resolve(jsonld);
        } catch (error) {
          reject(new Error(`Failed to parse Schema.org data: ${error}`));
        }
      });
      
      response.on('error', (error: Error) => {
        reject(error);
      });
    }
  });
}

/**
 * Extracts all Things from the JSON-LD data
 */
function parseThings(jsonld: any): any[] {
  const things: any[] = [];
  
  const graph = jsonld['@graph'] || [];
  
  console.log('Looking for Schema.org classes in the graph...');
  
  for (const item of graph) {
    const isClass = 
      (typeof item['@type'] === 'string' && 
        (item['@type'] === 'rdfs:Class' || 
         item['@type'].includes('http://www.w3.org/2000/01/rdf-schema#Class'))) ||
      (Array.isArray(item['@type']) && 
        (item['@type'].includes('rdfs:Class') || 
         item['@type'].some((t: string) => t.includes('http://www.w3.org/2000/01/rdf-schema#Class'))));
    
    const isSchemaOrg = 
      item['@id']?.startsWith('schema:') ||
      item['@id']?.startsWith('https://schema.org/') || 
      item['@id']?.startsWith('http://schema.org/');
    
    if (isClass && isSchemaOrg) {
      console.log(`Found Schema.org class: ${item['@id']}`);
      
      const convertedThing: any = {};
      for (const [key, value] of Object.entries(item)) {
        if (key.startsWith('@')) {
          convertedThing[`$${key.substring(1)}`] = value;
        } else {
          convertedThing[key] = value;
        }
      }
      things.push(convertedThing);
    }
  }
  
  return things;
}

/**
 * Resolves the inheritance chain to get all properties for a Thing
 */
function resolveInheritedProperties(thing: any, allThings: any[]): any[] {
  const properties: any[] = [];
  const visited = new Set<string>();
  
  function collectProperties(thingId: string) {
    if (visited.has(thingId)) return;
    visited.add(thingId);
    
    const directProperties = allThings.filter(item => {
      return item['$type']?.includes('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property') &&
        (Array.isArray(item.domainIncludes) 
          ? item.domainIncludes.some((domain: any) => domain['$id'] === thingId)
          : item.domainIncludes?.['$id'] === thingId);
    });
    
    properties.push(...directProperties);
    
    const currentThing = allThings.find(t => t['$id'] === thingId);
    if (currentThing?.subClassOf) {
      const parentIds = Array.isArray(currentThing.subClassOf) 
        ? currentThing.subClassOf.map((parent: any) => parent['$id'] || parent)
        : [currentThing.subClassOf['$id'] || currentThing.subClassOf];
      
      for (const parentId of parentIds) {
        collectProperties(parentId);
      }
    }
  }
  
  collectProperties(thing['$id']);
  
  const uniqueProperties = Array.from(
    new Map(properties.map(p => [p['$id'], p])).values()
  );
  
  return uniqueProperties.sort((a, b) => {
    const nameA = a.label || a.name || a['$id']?.split('/').pop() || '';
    const nameB = b.label || b.name || b['$id']?.split('/').pop() || '';
    return nameA.localeCompare(nameB);
  });
}

/**
 * Generates MDX content with frontmatter and markdown tables
 */
function generateMdxContent(thing: any, properties: any[]): string {
  const label = thing.label || thing.name || thing['$id']?.split('/').pop() || 'Unknown';
  const comment = thing.comment || thing.description || '';
  
  let frontmatter = '---\n';
  frontmatter += `$id: ${thing['$id']}\n`;
  frontmatter += `$type: ${thing['$type']}\n`;
  frontmatter += `label: ${label}\n`;
  
  if (comment) {
    frontmatter += `comment: ${comment}\n`;
  }
  
  if (thing.subClassOf) {
    const subClassOf = Array.isArray(thing.subClassOf)
      ? thing.subClassOf[0]['$id'] || thing.subClassOf[0]
      : thing.subClassOf['$id'] || thing.subClassOf;
    frontmatter += `subClassOf: ${subClassOf}\n`;
  }
  
  frontmatter += '---\n\n';
  
  let markdown = `# ${label}\n\n`;
  
  if (comment) {
    markdown += `${comment}\n\n`;
  }
  
  if (properties.length > 0) {
    markdown += '| Property | Expected Type | Description |\n';
    markdown += '| --- | --- | --- |\n';
    
    for (const property of properties) {
      const propName = property.label || property.name || property['$id']?.split('/').pop() || 'Unknown';
      
      let expectedType = 'Text';
      if (property.rangeIncludes) {
        const ranges = Array.isArray(property.rangeIncludes)
          ? property.rangeIncludes
          : [property.rangeIncludes];
          
        expectedType = ranges.map((range: any) => {
          const type = range['$id'] || range;
          return type.split('/').pop();
        }).join(' or ');
      }
      
      const description = property.comment || property.description || '';
      
      markdown += `| ${propName} | ${expectedType} | ${description} |\n`;
    }
  }
  
  return frontmatter + markdown;
}

/**
 * Writes the generated MDX files to the appropriate location
 */
async function writeFiles(things: any[], allThings: any[]): Promise<void> {
  const outputDir = path.join(process.cwd(), 'content', 'schema');
  
  try {
    await fs.mkdir(outputDir, { recursive: true });
    
    console.log(`Writing MDX files to ${outputDir}...`);
    
    let count = 0;
    for (const thing of things) {
      const name = thing.label || thing.name || thing['$id']?.split('/').pop() || 'Unknown';
      
      const filename = `${name.replace(/[^a-zA-Z0-9]/g, '')}.mdx`;
      const filePath = path.join(outputDir, filename);
      
      const properties = resolveInheritedProperties(thing, allThings);
      
      const content = generateMdxContent(thing, properties);
      
      await fs.writeFile(filePath, content, 'utf-8');
      count++;
      
      if (count % 100 === 0) {
        console.log(`Generated ${count} MDX files...`);
      }
    }
    
    console.log(`Successfully generated ${count} MDX files in ${outputDir}`);
  } catch (error) {
    console.error('Error writing MDX files:', error);
    throw error;
  }
}

/**
 * Main function to orchestrate the generation process
 */
async function main() {
  try {
    console.log('Fetching Schema.org JSON-LD data...');
    const jsonld = await fetchSchemaOrgJsonLd();
    
    // Debug the structure of the JSON-LD data
    console.log('JSON-LD structure:', Object.keys(jsonld));
    if (jsonld['@graph']) {
      console.log(`@graph array length: ${jsonld['@graph'].length}`);
      if (jsonld['@graph'].length > 0) {
        console.log('First few items in @graph:', JSON.stringify(jsonld['@graph'].slice(0, 3), null, 2));
      }
    } else {
      console.log('No @graph found in the JSON-LD data. Full data:', JSON.stringify(jsonld, null, 2));
    }
    
    console.log('Parsing Schema.org types...');
    const allThings = parseThings(jsonld);
    
    console.log(`Found ${allThings.length} Schema.org types.`);
    
    const things = allThings.filter(thing => {
      const type = thing['$type'];
      return (typeof type === 'string' && 
              (type === 'rdfs:Class' || 
               type.includes('http://www.w3.org/2000/01/rdf-schema#Class'))) ||
             (Array.isArray(type) && 
              (type.includes('rdfs:Class') || 
               type.some((t: string) => t.includes('http://www.w3.org/2000/01/rdf-schema#Class'))));
    });
    
    console.log(`Writing ${things.length} Schema.org classes as MDX...`);
    await writeFiles(things, allThings);
    
    console.log('Schema.org MDX generation complete!');
  } catch (error) {
    console.error('Error generating Schema.org MDX files:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);
