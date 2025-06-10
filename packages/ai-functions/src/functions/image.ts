import { parseTemplate } from '../utils/template.js'
import { generateImageStream } from '../llmService.js'

/**
 * Image template literal function for AI image generation
 *
 * Usage: await image`A salamander at sunrise in a forest pond in the Seychelles.`
 */
export type ImageTemplateFn = (template: TemplateStringsArray, ...values: any[]) => Promise<any>

const imageFunction_: ImageTemplateFn = function (template: TemplateStringsArray, ...values: any[]) {
  if (Array.isArray(template) && 'raw' in template) {
    const prompt = parseTemplate(template, values)
    return generateImageStream(prompt)
  }

  throw new Error('Image function must be called as a template literal')
}

export const image = new Proxy(imageFunction_, {
  get(target, prop) {
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return undefined
    }

    if (typeof prop === 'symbol') {
      return Reflect.get(target, prop)
    }

    return target
  },

  apply(target, thisArg, args) {
    if (Array.isArray(args[0]) && 'raw' in args[0]) {
      const prompt = parseTemplate(args[0] as TemplateStringsArray, args.slice(1))
      return generateImageStream(prompt)
    }

    throw new Error('Image function must be called as a template literal')
  },
})
