import { 
  parseTaskLists as originalParseTaskLists,
  serializeTaskItem as originalSerializeTaskItem,
  serializeTaskList as originalSerializeTaskList,
  serializeTaskLists as originalSerializeTaskLists,
  serializePlanResult as originalSerializePlanResult
} from '../../../mdxld/src/task-list'

export interface TaskItem {
  text: string;
  checked: boolean;
  line?: number;
  subtasks?: TaskItem[];
  position?: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
}

export interface TaskList {
  heading?: string;
  tasks: TaskItem[];
}

export interface PlanResult {
  tasks: TaskList[];
  markdown: string;
}

export interface ParseTaskListResult {
  tasks: TaskItem[];
  error?: string;
}

export const parseTaskLists = originalParseTaskLists;
export const serializeTaskItem = originalSerializeTaskItem;
export const serializeTaskList = originalSerializeTaskList;
export const serializeTaskLists = originalSerializeTaskLists;
export const serializePlanResult = originalSerializePlanResult;
