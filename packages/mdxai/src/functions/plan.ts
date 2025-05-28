import { generateText } from 'ai'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { model } from '../ai'
import { parseTemplate, TemplateFunction } from '../utils/template'

/**
 * Represents a single task item in a task list
 */
export interface TaskItem {
  /** The text content of the task */
  text: string
  /** Whether the task is completed (checked) */
  checked: boolean
  /** Line number where the task appears */
  line?: number
  /** Nested subtasks */
  subtasks?: TaskItem[]
}

/**
 * Represents a task list with its heading and items
 */
export interface TaskList {
  /** The heading/title of the task list section */
  heading?: string
  /** Array of task items */
  tasks: TaskItem[]
}

/**
 * The result object containing all extracted task lists
 */
export interface PlanResult {
  /** Array of task lists found in the markdown */
  tasks: TaskList[]
  /** The original markdown text */
  markdown: string
}

/**
 * Recursively extracts task items from a list item node
 */
const extractTaskItem = (listItem: any): TaskItem | null => {
  if (listItem.type !== 'listItem' || typeof listItem.checked !== 'boolean') {
    return null
  }

  // Extract the main text content
  const textNode = listItem.children?.[0]
  if (textNode?.type !== 'paragraph' || textNode.children?.[0]?.type !== 'text') {
    return null
  }

  const taskItem: TaskItem = {
    text: textNode.children[0].value,
    checked: listItem.checked,
    line: listItem.position?.start?.line
  }

  // Look for nested lists (subtasks)
  const nestedList = listItem.children?.find((child: any) => child.type === 'list')
  if (nestedList) {
    const subtasks: TaskItem[] = []
    for (const nestedListItem of nestedList.children) {
      const subtask = extractTaskItem(nestedListItem)
      if (subtask) {
        subtasks.push(subtask)
      }
    }
    if (subtasks.length > 0) {
      taskItem.subtasks = subtasks
    }
  }

  return taskItem
}

/**
 * Parses GitHub Flavored Markdown and extracts task lists with their headings
 * @param markdown - The markdown text to parse
 * @returns Array of task lists organized by headings
 */
export const parseTaskLists = (markdown: string): TaskList[] => {
  const processor = unified().use(remarkParse).use(remarkGfm)
  const mdast = processor.parse(markdown)
  
  const tasks: TaskList[] = []
  let currentHeading: string | undefined
  let currentTasks: TaskItem[] = []

  // Walk through the AST to find headings and task lists
  for (const child of mdast.children) {
    if (child.type === 'heading' && child.children?.[0]?.type === 'text') {
      // If we have accumulated tasks, save them before starting a new section
      if (currentTasks.length > 0) {
        tasks.push({
          heading: currentHeading,
          tasks: currentTasks
        })
        currentTasks = []
      }
      currentHeading = child.children[0].value
    } else if (child.type === 'list' && child.ordered === false) {
      // Process unordered list items for task lists
      for (const listItem of child.children) {
        const taskItem = extractTaskItem(listItem)
        if (taskItem) {
          currentTasks.push(taskItem)
        }
      }
    }
  }

  // Don't forget the last section
  if (currentTasks.length > 0) {
    tasks.push({
      heading: currentHeading,
      tasks: currentTasks
    })
  }

  return tasks
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