declare module 'mdxld' {
  /**
   * Represents a single task item in a task list
   */
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

  /**
   * Represents a task list with its heading and items
   */
  export interface TaskList {
    /** The heading/title of the task list section */
    heading?: string;
    /** Array of task items */
    tasks: TaskItem[];
  }

  /**
   * The result object containing all extracted task lists
   */
  export interface PlanResult {
    /** Array of task lists found in the markdown */
    tasks: TaskList[];
    /** The original markdown text */
    markdown: string;
  }

  /**
   * Legacy interface for backward compatibility
   */
  export interface ParseTaskListResult {
    tasks: TaskItem[];
    error?: string;
  }

  /**
   * Parse task list items from markdown content (legacy function)
   */
  export function parseTaskList(content: string): ParseTaskListResult;

  /**
   * Parse GitHub Flavored Markdown and extract task lists with their headings
   */
  export function parseTaskLists(markdown: string): TaskList[];

  /**
   * Serialize a single task item to markdown format
   */
  export function serializeTaskItem(task: TaskItem, indentLevel?: number): string;

  /**
   * Serialize a task list to markdown format
   */
  export function serializeTaskList(taskList: TaskList): string;

  /**
   * Serialize an array of task lists to complete markdown format
   */
  export function serializeTaskLists(taskLists: TaskList[]): string;

  /**
   * Serialize a PlanResult back to markdown format
   */
  export function serializePlanResult(planResult: PlanResult): string;
}
