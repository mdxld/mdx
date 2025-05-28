import yaml from 'yaml'

/**
 * Stringify a value for use in AI prompts
 * Objects and arrays are converted to YAML for better readability
 */
export function stringifyValue(value: any): string {
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    const yamlString = yaml.stringify(value)
    if (typeof yamlString === 'string') {
      return yamlString.trim()
    } else if (yamlString === undefined || yamlString === null) {
      return String(value)
    } else {
      return String(yamlString)
    }
  }
  return String(value)
}

/**
 * Parse a tagged template literal into a string
 * Handles interpolation of values using stringifyValue
 */
export function parseTemplate(template: TemplateStringsArray, values: any[]): string {
  let result = ''
  
  template.forEach((str, i) => {
    result += str
    if (i < values.length) {
      result += stringifyValue(values[i])
    }
  })
  
  return result
}

/**
 * Type definition for tagged template literal functions
 */
export type TemplateFunction<T = any> = (template: TemplateStringsArray, ...values: any[]) => T  

/**
 * Creates a unified function that supports three calling patterns:
 * 1. Tagged template literals: `result = await code\`fizzBuzz\``
 * 2. Curried tagged template with options: `result = await code\`fizzBuzz\`({ model: 'openai/o3' })`
 * 3. Normal function calls: `result = await code('fizzBuzz', { model: 'openai/o3' })`
 * 
 * @param callback Function that receives the parsed template and options
 * @returns A unified function supporting all three calling patterns
 */
export function createUnifiedFunction<T>(
  callback: (parsedTemplate: string, options: Record<string, any>) => T
) {
  const unifiedFunction = function(...args: any[]) {
    if (typeof args[0] === 'string') {
      const [template, options = {}] = args
      return callback(template, options)
    }
    
    if (Array.isArray(args[0]) && 'raw' in args[0]) {
      const [template, ...values] = args
      const parsedTemplate = parseTemplate(template as TemplateStringsArray, values)
      return callback(parsedTemplate, {})
    }
    
    throw new Error('Function must be called as a template literal or with string and options')
  }

  // Create a proxy that supports all three calling patterns
  return new Proxy(unifiedFunction, {
    apply(target, thisArg, args) {
      return target(...args)
    },
    
    get(target, prop, receiver) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return undefined
      }
      
      if (typeof prop === 'symbol') {
        return Reflect.get(target, prop, receiver)
      }
      
      return function(...args: any[]) {
        if (Array.isArray(args[0]) && 'raw' in args[0]) {
          const [template, ...values] = args
          const parsedTemplate = parseTemplate(template as TemplateStringsArray, values)
          
          return function(options: Record<string, any> = {}) {
            return callback(parsedTemplate, options)
          }
        }
        
        throw new Error('Invalid call pattern')
      }
    }
  })
}        