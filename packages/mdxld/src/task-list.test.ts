import { describe, it, expect } from 'vitest'
import { 
  parseTaskList, 
  parseTaskLists, 
  serializeTaskItem, 
  serializeTaskList, 
  serializeTaskLists, 
  serializePlanResult,
  TaskItem,
  TaskList,
  PlanResult
} from './task-list.js'

describe('parseTaskList (legacy)', () => {
  it('should parse task list items from markdown content', () => {
    const content = `
# Test Task List

- [ ] Unchecked task
- [x] Checked task
- Regular list item
- [ ] Another unchecked task
    - [x] Nested checked task
`

    const result = parseTaskList(content)

    expect(result.error).toBeUndefined()
    expect(result.tasks).toHaveLength(4)

    expect(result.tasks[0].text).toBe('Unchecked task')
    expect(result.tasks[0].checked).toBe(false)

    expect(result.tasks[1].text).toBe('Checked task')
    expect(result.tasks[1].checked).toBe(true)

    expect(result.tasks[2].text).toBe('Another unchecked task')
    expect(result.tasks[2].checked).toBe(false)

    expect(result.tasks[3].text).toBe('Nested checked task')
    expect(result.tasks[3].checked).toBe(true)
  })

  it('should return empty array for content without task list items', () => {
    const content = `
# Regular Markdown

- Regular list item
- Another regular list item
`

    const result = parseTaskList(content)

    expect(result.error).toBeUndefined()
    expect(result.tasks).toHaveLength(0)
  })

  it('should handle empty content', () => {
    const result = parseTaskList('')

    expect(result.error).toBeUndefined()
    expect(result.tasks).toHaveLength(0)
  })

  it('should handle malformed markdown gracefully', () => {
    const content = '```javascript\nconst x = [unclosed array'

    const result = parseTaskList(content)

    expect(result.tasks).toHaveLength(0)
    expect(result.error).toBeDefined()
  })
})

describe('parseTaskLists', () => {
  it('should parse simple task lists without headings', () => {
    const markdown = `
- [ ] Task 1
- [x] Task 2
- [ ] Task 3
`
    const result = parseTaskLists(markdown)
    
    expect(result).toHaveLength(1)
    expect(result[0].heading).toBeUndefined()
    expect(result[0].tasks).toHaveLength(3)
    expect(result[0].tasks[0]).toEqual({
      text: 'Task 1',
      checked: false,
      line: 2,
      position: expect.any(Object)
    })
    expect(result[0].tasks[1]).toEqual({
      text: 'Task 2',
      checked: true,
      line: 3,
      position: expect.any(Object)
    })
    expect(result[0].tasks[2]).toEqual({
      text: 'Task 3',
      checked: false,
      line: 4,
      position: expect.any(Object)
    })
  })

  it('should parse task lists with headings', () => {
    const markdown = `
# Setup
- [ ] Install dependencies
- [x] Configure environment

# Development
- [ ] Write tests
- [ ] Implement features
`
    const result = parseTaskLists(markdown)
    
    expect(result).toHaveLength(2)
    
    expect(result[0].heading).toBe('Setup')
    expect(result[0].tasks).toHaveLength(2)
    expect(result[0].tasks[0].text).toBe('Install dependencies')
    expect(result[0].tasks[0].checked).toBe(false)
    expect(result[0].tasks[1].text).toBe('Configure environment')
    expect(result[0].tasks[1].checked).toBe(true)
    
    expect(result[1].heading).toBe('Development')
    expect(result[1].tasks).toHaveLength(2)
    expect(result[1].tasks[0].text).toBe('Write tests')
    expect(result[1].tasks[1].text).toBe('Implement features')
  })

  it('should parse nested subtasks', () => {
    const markdown = `
# Project Setup
- [ ] Initial setup
  - [ ] Install dependencies
  - [x] Configure environment
    - [x] Set up .env file
    - [ ] Configure database
- [ ] Documentation
  - [ ] Write README
  - [ ] API documentation
`
    const result = parseTaskLists(markdown)
    
    expect(result).toHaveLength(1)
    expect(result[0].heading).toBe('Project Setup')
    expect(result[0].tasks).toHaveLength(2)
    
    const firstTask = result[0].tasks[0]
    expect(firstTask.text).toBe('Initial setup')
    expect(firstTask.checked).toBe(false)
    expect(firstTask.subtasks).toHaveLength(2)
    
    expect(firstTask.subtasks![0].text).toBe('Install dependencies')
    expect(firstTask.subtasks![0].checked).toBe(false)
    
    expect(firstTask.subtasks![1].text).toBe('Configure environment')
    expect(firstTask.subtasks![1].checked).toBe(true)
    expect(firstTask.subtasks![1].subtasks).toHaveLength(2)
    
    expect(firstTask.subtasks![1].subtasks![0].text).toBe('Set up .env file')
    expect(firstTask.subtasks![1].subtasks![0].checked).toBe(true)
    expect(firstTask.subtasks![1].subtasks![1].text).toBe('Configure database')
    expect(firstTask.subtasks![1].subtasks![1].checked).toBe(false)
    
    const secondTask = result[0].tasks[1]
    expect(secondTask.text).toBe('Documentation')
    expect(secondTask.subtasks).toHaveLength(2)
    expect(secondTask.subtasks![0].text).toBe('Write README')
    expect(secondTask.subtasks![1].text).toBe('API documentation')
  })

  it('should handle empty markdown', () => {
    const result = parseTaskLists('')
    expect(result).toHaveLength(0)
  })
})

describe('serializeTaskItem', () => {
  it('should serialize a simple task item', () => {
    const task: TaskItem = {
      text: 'Simple task',
      checked: false
    }
    
    const result = serializeTaskItem(task)
    expect(result).toBe('- [ ] Simple task\n')
  })

  it('should serialize a completed task item', () => {
    const task: TaskItem = {
      text: 'Completed task',
      checked: true
    }
    
    const result = serializeTaskItem(task)
    expect(result).toBe('- [x] Completed task\n')
  })

  it('should serialize a task with subtasks', () => {
    const task: TaskItem = {
      text: 'Main task',
      checked: false,
      subtasks: [
        { text: 'Subtask 1', checked: true },
        { text: 'Subtask 2', checked: false }
      ]
    }
    
    const result = serializeTaskItem(task)
    const expected = `- [ ] Main task
  - [x] Subtask 1
  - [ ] Subtask 2
`
    expect(result).toBe(expected)
  })
})

describe('serializeTaskList', () => {
  it('should serialize a task list without heading', () => {
    const taskList: TaskList = {
      tasks: [
        { text: 'Task 1', checked: false },
        { text: 'Task 2', checked: true }
      ]
    }
    
    const result = serializeTaskList(taskList)
    const expected = `- [ ] Task 1
- [x] Task 2
`
    expect(result).toBe(expected)
  })

  it('should serialize a task list with heading', () => {
    const taskList: TaskList = {
      heading: 'My Tasks',
      tasks: [
        { text: 'Task 1', checked: false },
        { text: 'Task 2', checked: true }
      ]
    }
    
    const result = serializeTaskList(taskList)
    const expected = `# My Tasks
- [ ] Task 1
- [x] Task 2
`
    expect(result).toBe(expected)
  })
})

describe('round-trip operations', () => {
  it('should maintain data integrity through parse -> serialize cycle', () => {
    const originalMarkdown = `# Setup
- [ ] Install dependencies
- [x] Configure environment
  - [x] Set up .env file
  - [ ] Configure database

# Development
- [ ] Write tests
- [ ] Implement features
  - [ ] User authentication
  - [ ] Data processing
`
    
    const parsed = parseTaskLists(originalMarkdown)
    
    const serialized = serializeTaskLists(parsed)
    
    const reparsed = parseTaskLists(serialized)
    
    expect(reparsed).toHaveLength(parsed.length)
    
    for (let i = 0; i < parsed.length; i++) {
      expect(reparsed[i].heading).toBe(parsed[i].heading)
      expect(reparsed[i].tasks).toHaveLength(parsed[i].tasks.length)
    }
  })
})
