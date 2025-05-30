import { generateText } from 'ai'
import { 
  TaskItem, 
  TaskList, 
  PlanResult,
  parseTaskLists,
  serializeTaskLists
} from 'mdxld'
import { model } from '../ai'
import { parseTemplate, TemplateFunction, createUnifiedFunction } from '../utils/template'

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
