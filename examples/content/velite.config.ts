import { defineConfig, defineCollection, s } from 'velite'

const articles = defineCollection({
  name: 'articles',
  pattern: 'articles/**/*.mdx',
  schema: s.object({
    title: s.string().max(99).optional(),
    slug: s.slug(),
    date: s.isodate().optional(),
    description: s.string().max(999).optional(),
    published: s.boolean().default(true),
    body: s.mdx(),
  }),
})

export default defineConfig({
  root: '.',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  collections: { articles },
})
