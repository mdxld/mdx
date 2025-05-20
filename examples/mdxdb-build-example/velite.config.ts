import { defineConfig, s } from 'velite';

const articles = {
  name: 'Article',
  pattern: 'content/articles/**/*.mdx',
  schema: s.object({
    title: s.string(),
    slug: s.slug('global', ['title']),
    date: s.isodate(),
    description: s.string().optional(),
    body: s.markdown() // Or s.mdx() if you have MDX specific features
  }).transform(data => ({ ...data, permalink: `/articles/${data.slug}` }))
};

export default defineConfig({
  root: '.', // Velite should operate in the example project's root
  collections: { articles }
});
