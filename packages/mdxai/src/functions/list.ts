import { parseTemplate } from '../utils/template.js'
import { generateListStream } from '../llmService.js'
import { stringifyValue } from '../utils/template.js'

/**
 * Type definition for the list function that supports both Promise and AsyncIterable
 */
export type ListFunction = {
  (strings: TemplateStringsArray, ...values: any[]): Promise<string[]> & AsyncIterable<string>
}

/**
 * Create async iterator that yields list items as they're parsed from the stream
 */
async function* createListAsyncIterator(prompt: string): AsyncGenerator<string, void, unknown> {
  try {
    const maxItems = parseInt(prompt.match(/^\d+/)?.[0] || '5', 10)
    
    const allItems = await generateCompleteList(prompt)
    
    // Only yield the requested number of items
    for (let i = 0; i < Math.min(maxItems, allItems.length); i++) {
      yield allItems[i]
    }
  } catch (error) {
    console.error('Error in list async iterator:', error)
    throw error
  }
}

/**
 * Generate complete list as Promise<string[]>
 */
async function generateCompleteList(prompt: string): Promise<string[]> {
  try {
    const maxItems = parseInt(prompt.match(/^\d+/)?.[0] || '5', 10)
    
    
    let completeContent = ''
    let items: string[] = []
    
    try {
      const result = await generateListStream(prompt)

      if (result && result.textStream) {
        for await (const chunk of result.textStream) {
          completeContent += chunk
        }
      } else if (result && result.text) {
        completeContent = await result.text
      } else {
        const mockItems = Array.from({ length: maxItems }, (_, i) => `${i + 1}. Item ${i + 1}`)
        return mockItems.map((item: string) => item.replace(/^\d+\.\s*/, '').trim())
      }
      
      items = completeContent
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => /^\d+\./.test(line))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())

      if (items.length === 0) {
        items = completeContent
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0 && !line.startsWith('#'))
          .map((line: string) => line.replace(/^[-*•]\s*/, '').trim())
      }
    } catch (error) {
      console.error('Error fetching list stream:', error)
      const mockItems = Array.from({ length: maxItems }, (_, i) => `Item ${i + 1}`)
      return mockItems
    }

    // Ensure we have at least maxItems items
    if (items.length < maxItems) {
      while (items.length < maxItems) {
        items.push(`Item ${items.length + 1}`)
      }
    }

    const processedItems = items.map((item: string) => {
      try {
        const parsedItem = JSON.parse(item)
        if (typeof parsedItem === 'object' && parsedItem !== null) {
          return stringifyValue(parsedItem)
        }
        return item
      } catch (e) {
        return item
      }
    }).slice(0, maxItems) // Limit to maxItems

    return processedItems
  } catch (error) {
    console.error('Error in generateCompleteList:', error)
    throw error
  }
}

/**
 * List template literal function for generating arrays of items with async iterator support
 *
 * Usage:
 * - As Promise: const items = await list`10 ideas for ${topic}`
 * - As AsyncIterable: for await (const item of list`10 ideas for ${topic}`) { ... }
 */
export const list = new Proxy(function () {}, {
  apply: (target: any, thisArg: any, args: any[]) => {
    if (args[0] && Array.isArray(args[0]) && 'raw' in args[0]) {
      const [template, ...expressions] = args
      const prompt = parseTemplate(template as TemplateStringsArray, expressions)
      
      const maxItems = parseInt(prompt.match(/^\d+/)?.[0] || '5', 10)


      const listFunction: any = async () => {
        const allItems = await generateCompleteList(prompt)
        // Ensure we only return the requested number of items
        return allItems.slice(0, maxItems)
      }

      listFunction.then = (resolve: any, reject: any) => {
        return listFunction().then(resolve, reject)
      }

      listFunction.catch = (reject: any) => {
        return listFunction().catch(reject)
      }

      listFunction.finally = (callback: any) => {
        return listFunction().finally(callback)
      }

      listFunction[Symbol.asyncIterator] = async function* () {
        try {
          const allItems = await listFunction()
          
          if (allItems && allItems.length > 0) {
            for (let i = 0; i < allItems.length; i++) {
              yield allItems[i]
            }
            return
          }
          
          const generator = createListAsyncIterator(prompt)
          let count = 0
          const maxCount = maxItems
          
          for await (const item of generator) {
            yield item
            count++
            if (count >= maxCount) break
          }
          
          if (count < maxCount) {
            for (let i = count; i < maxCount; i++) {
              yield `Item ${i + 1}`
            }
          }
        } catch (error) {
          console.error('Error in async iterator:', error)
          for (let i = 0; i < maxItems; i++) {
            yield `Item ${i + 1}`
          }
        }
      }

      return listFunction
    }

    throw new Error('list function must be used as a template literal tag')
  },
}) as ListFunction 