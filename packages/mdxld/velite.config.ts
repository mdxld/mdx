import { defineConfig, s } from 'velite'

const schema = s.object({
  $: s.object({
    html: s.markdown(),
    meta: s.metadata(),
    mdx: s.raw(),
    code: s.mdx(),
  }).optional(),
  $id: s.string().optional(),
  $type: s.string().optional(),
  $context: s.string().optional(),
})
.passthrough()
.transform((obj) => {
  const $ = obj.$ || {
    html: '',
    meta: {},
    mdx: '',
    code: {}
  };
  const { ...data } = obj;
  return {
    id: data.$id,
    type: data.$type,
    context: data.$context,
    $,
    data
  }
})

export default defineConfig({
  root: process.cwd(),
  collections: {
    mdx: { name: 'mdx', pattern: '**/*.{md,mdx}', schema },
  },
  output: { data: '.mdx' }
})
