// Re-export all AI functions from their individual modules
export { ai, generateAiText, type AiFunction, type TemplateFn } from './functions/ai.js'
export { list, type ListFunction } from './functions/list.js'
export { research, type ResearchTemplateFn } from './functions/research.js'
export { extract, type ExtractFunction, type ExtractResult, type ExtractType } from './functions/extract.js'
export { is } from './functions/is.js'
export { say, type SayTemplateFn } from './functions/say.js'
export { image, type ImageTemplateFn } from './functions/image.js'
export { video } from './functions/video.js'

// Re-export utilities
export { parseTemplate, stringifyValue, type TemplateFunction } from './utils/template.js'
export { executeAiFunction, createZodSchemaFromObject, inferAndValidateOutput } from './utils/ai-execution.js'
export { handleStringOutput, handleArrayOutput, handleObjectOutput } from './utils/output-handlers.js'

// Re-export existing utilities
export {
  findAiFunction,
  findAiFunctionEnhanced,
  ensureAiFunctionExists,
  createAiFolderStructure,
  writeAiFunction,
  findAiFunctionsInHierarchy,
  createAiFunctionVersion,
  listAiFunctionVersions,
  AI_FOLDER_STRUCTURE,
  ensureDirectoryExists,
} from './utils.js'
