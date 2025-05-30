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
   * The result object from the simpler task list parser
   */
  export interface ParseTaskListResult {
    tasks: TaskItem[];
    error?: string;
  }

  /**
   * Parses GitHub Flavored Markdown and extracts task lists with their headings
   */
  export function parseTaskLists(markdown: string): TaskList[];

  /**
   * Parses a task list from markdown
   */
  export function parseTaskList(markdown: string): ParseTaskListResult;

  /**
   * Serializes a single task item to markdown format
   */
  export function serializeTaskItem(task: TaskItem, indentLevel?: number): string;

  /**
   * Serializes a task list to markdown format
   */
  export function serializeTaskList(taskList: TaskList): string;

  /**
   * Serializes an array of task lists to complete markdown format
   */
  export function serializeTaskLists(taskLists: TaskList[]): string;

  /**
   * Serializes a PlanResult back to markdown format
   */
  export function serializePlanResult(planResult: PlanResult): string;
}
