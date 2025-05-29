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
 * 1. Tagged template literals: `result = await fn\`template\``
 * 2. Curried tagged template with options: `result = await fn\`template\`({ option: 'value' })`
 * 3. Normal function calls: `result = await fn('template', { option: 'value' })`
 * 
 * @param callback Function that receives the parsed template and options
 * @returns A unified function supporting all three calling patterns
 */
export function createUnifiedFunction<T>(
  callback: (parsedTemplate: string, options: Record<string, any>) => T
): any {
  // This function handles both normal function calls and tagged template literals
  function unifiedFunction(...args: any[]): any {
    if (args.length === 0 || args[0] === undefined) {
      throw new Error('Function must be called as a template literal or with string and options')
    }
    
    // Pattern 3: Normal function call - fn('template', { option: 'value' })
    if (typeof args[0] === 'string') {
      const [template, options = {}] = args
      return callback(template, options)
    }
    
    // Pattern 1: Tagged template literal - fn`template`
    if (Array.isArray(args[0]) && 'raw' in args[0]) {
      const [template, ...values] = args
      const parsedTemplate = parseTemplate(template as TemplateStringsArray, values)
      return callback(parsedTemplate, {})
    }
    
    throw new Error('Function must be called as a template literal or with string and options')
  }

  // Create a proxy to handle the curried pattern
  return new Proxy(unifiedFunction, {
    // Handle direct function calls (Pattern 1 and 3)
    apply(target, thisArg, args) {
      if (args.length === 0 || args[0] === undefined) {
        throw new Error('Function must be called as a template literal or with string and options')
      }
      
      try {
        return target.apply(thisArg, args)
      } catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('Function must be called as a template literal or with string and options')
      }
    },
    
    // Handle property access for curried calls (Pattern 2)
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return undefined
      }
      
      // Handle Symbol.asyncIterator specially
      if (prop === Symbol.asyncIterator) {
        return undefined
      }
      
      // Return a function that handles the template literal part of Pattern 2
      return function(...templateArgs: any[]) {
        // Ensure we're dealing with a template literal
        if (Array.isArray(templateArgs[0]) && 'raw' in templateArgs[0]) {
          const [template, ...values] = templateArgs
          const parsedTemplate = parseTemplate(template as TemplateStringsArray, values)
          
          // Create a function that handles the options part of Pattern 2
          const optionsHandler: any = function(options: Record<string, any> = {}) {
            const result = callback(parsedTemplate, options)
            return result
          }
          
          optionsHandler[Symbol.asyncIterator] = function() {
            const result = callback(parsedTemplate, this) as any
            
            if (result && typeof result === 'object' && Symbol.asyncIterator in result) {
              return result[Symbol.asyncIterator]()
            }
            
            throw new Error('Result is not async iterable')
          }
          
          return optionsHandler
        }
        
        throw new Error('Function must be called as a template literal or with string and options')
      }
    }
  })
}                                                                                        