declare module 'mdxld' {
  export interface TaskItem {
    text: string
    checked: boolean
    line?: number
    subtasks?: TaskItem[]
    position?: {
      start: { line: number; column: number; offset: number }
      end: { line: number; column: number; offset: number }
    }
  }

  export interface TaskList {
    heading?: string
    tasks: TaskItem[]
  }

  export interface PlanResult {
    tasks: TaskList[]
    markdown: string
  }

  export interface ParseTaskListResult {
    tasks: TaskItem[]
    error?: string
  }

  export function parseTaskLists(markdown: string): TaskList[]
  export function parseTaskList(content: string): ParseTaskListResult
  export function serializeTaskItem(task: TaskItem, indentLevel?: number): string
  export function serializeTaskList(taskList: TaskList): string
  export function serializeTaskLists(taskLists: TaskList[]): string
  export function serializePlanResult(planResult: PlanResult): string
}
