export interface TaskItem {
  /** The text content of the task */
  text: string;
  /** Whether the task is completed (checked) */
  checked: boolean;
  /** Line number where the task appears */
  line?: number;
  /** Nested subtasks */
  subtasks?: TaskItem[];
  /** Position information (for backward compatibility) */
  position?: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
}

export interface TaskList {
  /** The heading/title of the task list section */
  heading?: string;
  /** Array of task items */
  tasks: TaskItem[];
}

export interface PlanResult {
  /** Array of task lists found in the markdown */
  tasks: TaskList[];
  /** The original markdown text */
  markdown: string;
}

export interface ParseTaskListResult {
  tasks: TaskItem[];
  error?: string;
}

export function parseTaskList(content: string): ParseTaskListResult;

export function parseTaskLists(markdown: string): TaskList[];

export function serializeTaskItem(task: TaskItem, indentLevel?: number): string;

export function serializeTaskList(taskList: TaskList): string;

export function serializeTaskLists(taskLists: TaskList[]): string;

export function serializePlanResult(planResult: PlanResult): string;
