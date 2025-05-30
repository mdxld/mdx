import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'

/**
 * Represents a single task item in a (possibly nested) task list
 */
export interface TaskItem {
  /** The text content of the task */
  text: string
  /** Whether the task is completed (checked) */
  checked: boolean
  /** Source line number (1-based) where this task appears, if available */
  line?: number
  /** Nested subtasks */
  subtasks?: TaskItem[]
}

/**
 * Represents a task list section which may be grouped under a markdown heading
 */
export interface TaskList {
  /** The heading/title of the task list section (if any) */
  heading?: string
  /** Array of task items contained in this section */
  tasks: TaskItem[]
}

/**
 * Walk an mdast listItem node recursively and convert it to a TaskItem structure.
 */
const extractTaskItem = (listItem: any): TaskItem | null => {
  if (listItem.type !== 'listItem' || typeof listItem.checked !== 'boolean') {
    return null
  }

  // Obtain the first paragraph child which should contain the plain-text description
  const textNode = listItem.children?.[0]
  if (textNode?.type !== 'paragraph' || textNode.children?.[0]?.type !== 'text') {
    return null
  }

  const taskItem: TaskItem = {
    text: textNode.children[0].value,
    checked: listItem.checked,
    line: listItem.position?.start?.line,
  }

  // Collect subtasks from a nested list (if present)
  const nestedList = listItem.children?.find((child: any) => child.type === 'list')
  if (nestedList) {
    const subtasks: TaskItem[] = []
    for (const nestedListItem of nestedList.children) {
      const subtask = extractTaskItem(nestedListItem)
      if (subtask) subtasks.push(subtask)
    }
    if (subtasks.length) taskItem.subtasks = subtasks
  }

  return taskItem
}

/**
 * Parse GitHub-Flavoured Markdown and extract task lists organised by headings.
 *
 * For example the following markdown:
 *
 * ```md
 * # Research
 * - [ ] Do something
 * - [x] Done task
 *
 * ## Sub section
 * - [ ] Another task
 * ```
 *
 * will yield an array with two TaskList objects (for the two heading sections).
 */
export const parseTaskLists = (markdown: string): TaskList[] => {
  const processor = unified().use(remarkParse).use(remarkGfm)
  const mdast = processor.parse(markdown)

  const tasks: TaskList[] = []
  let currentHeading: string | undefined
  let currentTasks: TaskItem[] = []

  for (const child of mdast.children) {
    if (child.type === 'heading' && child.children?.[0]?.type === 'text') {
      // Push previous collected tasks (if any) before starting a new heading section
      if (currentTasks.length) {
        tasks.push({ heading: currentHeading, tasks: currentTasks })
        currentTasks = []
      }
      currentHeading = child.children[0].value
    } else if (child.type === 'list' && child.ordered === false) {
      for (const listItem of child.children) {
        const taskItem = extractTaskItem(listItem)
        if (taskItem) currentTasks.push(taskItem)
      }
    }
  }

  // Handle leftover tasks with no subsequent heading
  if (currentTasks.length) {
    tasks.push({ heading: currentHeading, tasks: currentTasks })
  }

  return tasks
}

/**
 * Serialise a single TaskItem back into markdown.
 */
export const serializeTaskItem = (task: TaskItem, indentLevel = 0): string => {
  const indent = '  '.repeat(indentLevel)
  const checkbox = task.checked ? '[x]' : '[ ]'
  let result = `${indent}- ${checkbox} ${task.text}\n`

  if (task.subtasks?.length) {
    for (const subtask of task.subtasks) {
      result += serializeTaskItem(subtask, indentLevel + 1)
    }
  }

  return result
}

/** Serialize an entire TaskList section to markdown. */
export const serializeTaskList = (taskList: TaskList): string => {
  let result = ''

  if (taskList.heading) {
    result += `# ${taskList.heading}\n`
  }

  for (const task of taskList.tasks) {
    result += serializeTaskItem(task)
  }

  return result
}

/**
 * Serialise multiple TaskList sections into a single markdown document.
 */
export const serializeTaskLists = (taskLists: TaskList[]): string => {
  let result = ''

  for (let i = 0; i < taskLists.length; i++) {
    result += serializeTaskList(taskLists[i])

    if (i < taskLists.length - 1) {
      result += '\n' // Blank line between sections
    }
  }

  return result
}

/** Convenience helper to turn the output of parseTaskLists back to markdown. */
export const serializePlanResult = (taskLists: TaskList[]): string => serializeTaskLists(taskLists)