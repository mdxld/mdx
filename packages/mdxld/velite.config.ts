import { defineConfig } from 'velite'

export default defineConfig({
  root: process.cwd(),
  collections: {
    mdx: {
      name: 'mdx',
      pattern: '*.mdx',
      schema: (s) => ({
        $id: s.string().optional(),
        $type: s.string().optional(),
        label: s.string().optional(),
        'rdfs:comment': s.string().optional(),
        'rdfs:label': s.string().optional(),
        'rdfs:subClassOf': s.json().optional(),
        'schema:isPartOf': s.json().optional(),
        'schema:source': s.json().optional(),
        raw: s.mdx(),
        code: s.mdx({ mdxOptions: { jsx: true, format: 'mdx' } })
      })
    }
  },
  output: { data: '.mdx' }
})
