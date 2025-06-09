import { parseTemplate, stringifyValue, createUnifiedFunction } from '../utils/template.js'
import { streamText } from 'ai'
import { model } from '../ai.js'

/**
 * Return type that supports both Promise and AsyncIterable
 */
type ListResult = Promise<string[]> & AsyncIterable<string> & {
  (options: Record<string, any>): Promise<string[]> & AsyncIterable<string>
}

/**
 * Type definition for the list function that supports both Promise and AsyncIterable
 */
export type ListFunction = {
  (strings: TemplateStringsArray, ...values: any[]): ListResult
  (text: string, options?: Record<string, any>): Promise<string[]> & AsyncIterable<string>
}

/**
 * Generate complete list as Promise<string[]>
 */
async function generateCompleteList(prompt: string, options: Record<string, any> = {}): Promise<string[]> {
  try {
    const maxItems = parseInt(prompt.match(/^\d+/)?.[0] || '5', 10)
    
    let completeContent = ''
    let items: string[] = []
    
    try {
      const result = await streamText({
        model: model(options.model || 'google/gemini-2.5-flash-preview-05-20', { structuredOutputs: true }),
        prompt: `${prompt}\n\nRespond with a numbered markdown ordered list.`,
      })

      if (result && result.textStream) {
        for await (const chunk of result.textStream) {
          completeContent += chunk
        }
      } else if (result && result.text) {
        completeContent = await result.text
      } else {
        throw new Error('No valid response received from AI service')
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
      throw new Error('Failed to generate list from AI service')
    }

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
 * Create a list result that supports both Promise and AsyncIterable patterns
 */
function createListResult(template: string, options: Record<string, any> = {}): any {
  const maxItems = parseInt(template.match(/^\d+/)?.[0] || '5', 10)
  
  const listFn = async () => {
    const items = await generateCompleteList(template, options)
    return items.slice(0, maxItems)
  }
  
  const result: any = listFn
  
  result.then = (resolve: any, reject: any) => {
    return listFn().then(resolve, reject)
  }
  
  result.catch = (reject: any) => {
    return listFn().catch(reject)
  }
  
  result.finally = (callback: any) => {
    return listFn().finally(callback)
  }
  
  result[Symbol.asyncIterator] = async function* () {
    try {
      const items = await listFn()
      for (let i = 0; i < Math.min(maxItems, items.length); i++) {
        yield items[i]
      }
    } catch (error) {
      console.error('Error in async iterator:', error)
      for (let i = 0; i < maxItems; i++) {
        yield `Item ${i + 1}`
      }
    }
  }
  
  return result
}

/**
 * Core function for list generation that handles both string content and options
 */
function listCore(content: string, options: Record<string, any> = {}): any {
  const result = createListResult(content, options)
  
  const originalThen = result.then
  
  Object.defineProperty(result, 'then', {
    get() {
      return originalThen
    }
  })
  
  return new Proxy(result, {
    apply(target, thisArg, args) {
      const newOptions = args[0] || {}
      return createListResult(content, newOptions)
    }
  })
}

/**
 * List function implementation that supports all calling patterns
 */
export const list: ListFunction = createUnifiedFunction<any>(
  (content: string, options: Record<string, any>) => {
    return listCore(content, options)
  }
)
