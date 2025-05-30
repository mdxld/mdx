import { generateText } from 'ai'
import { model } from '../ai'
import { parseTemplate, TemplateFunction } from '../utils/template'
// Re-use task-list parsing/serialisation from mdxld
import {
  parseTaskLists,
  serializeTaskItem,
  serializeTaskList,
  serializeTaskLists,
  TaskItem,
  TaskList,
} from 'mdxld/src/task-lists'

/**
 * The result object containing all extracted task lists
 */
export interface PlanResult {
  /** Array of task lists found in the markdown */
  tasks: TaskList[]
  /** The original markdown text */
  markdown: string
}

export const plan: TemplateFunction<Promise<PlanResult>> = async (template: TemplateStringsArray, ...values: any[]) => {
  const requirements = parseTemplate(template, values)

  const result = await generateText({
    model: model('google/gemini-2.5-pro-preview'),
    system: `You are a CTO. Respond only in GitHub Flavored Markdown with task lists. Use headings to organize different sections of the plan. If needed, tasks can have subtasks.`,
    prompt: `Create a detailed plan for: ${requirements}`,
  })

  const markdown = result.text
  const tasks = parseTaskLists(markdown)

  return {
    tasks,
    markdown
  }
}

export const serializePlanResult = (planResult: PlanResult): string => serializeTaskLists(planResult.tasks)

// Re-export task-list helpers so existing downstream imports continue to work.
export { parseTaskLists, serializeTaskItem, serializeTaskList, serializeTaskLists, TaskItem, TaskList }