/**
 * Global functions and objects for MDX code execution
 */

export const on = (event: string, callback: Function) => {
  return callback
}

export const send = (event: string, data: any) => {
  return { event, data }
}

export const ai = new Proxy({}, {
  apply: (_target, _thisArg, args) => {
    return `AI response for: ${args[0]}`
  },
  get: (_target, prop) => {
    return (...args: any[]) => {
      return { function: prop, args }
    }
  }
})

export const list = (strings: TemplateStringsArray, ...values: any[]) => {
  const input = strings.reduce((acc, str, i) => 
    acc + str + (values[i] !== undefined ? JSON.stringify(values[i]) : ''), '')
  
  return {
    [Symbol.asyncIterator]: async function* () {
      for (let i = 1; i <= 3; i++) {
        yield `Item ${i} for ${input}`
      }
    }
  }
}

export const research = (strings: TemplateStringsArray, ...values: any[]) => {
  const input = strings.reduce((acc, str, i) => 
    acc + str + (values[i] !== undefined ? JSON.stringify(values[i]) : ''), '')
  
  return `Research results for: ${input}`
}

export const extract = (strings: TemplateStringsArray, ...values: any[]) => {
  const input = strings.reduce((acc, str, i) => 
    acc + str + (values[i] !== undefined ? JSON.stringify(values[i]) : ''), '')
  
  return {
    [Symbol.asyncIterator]: async function* () {
      for (let i = 1; i <= 3; i++) {
        yield `Extracted item ${i} from ${input}`
      }
    }
  }
}

export const db = new Proxy({}, {
  get: (_target, collection) => {
    return {
      create: (title: string, content: string) => {
        return { collection, title, content }
      },
      find: (query: any) => {
        return { collection, query }
      }
    }
  }
})
