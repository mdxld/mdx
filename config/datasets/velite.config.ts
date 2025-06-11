import { defineConfig, s } from 'velite'

// `s` is extended from Zod with some custom schemas,
// you can also import re-exported `z` from `velite` if you don't need these extension schemas.

export default defineConfig({
  collections: {
    naics: {
      name: 'NAICS',
      pattern: 'naics.md',
      schema: s
        .object({
          title: s.string(),
          type: s.string(),
          content: s.markdown()
        })
    },
    occupations: {
      name: 'Occupation', 
      pattern: 'occupations.md',
      schema: s
        .object({
          title: s.string(),
          type: s.string(),
          content: s.markdown()
        })
    }
  }
})
