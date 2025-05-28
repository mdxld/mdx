import yaml from 'yaml'

/**
 * Stringify a value for use in AI prompts
 * Objects and arrays are converted to YAML for better readability
 */
export function stringifyValue(value: any): string {
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    return yaml.stringify(value).trim()
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