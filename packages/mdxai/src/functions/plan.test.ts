import 'dotenv/config'
import { describe, it, expect } from 'vitest'
import { 
  parseTaskLists, 
  TaskList, 
  TaskItem, 
  serializeTaskItem, 
  serializeTaskList, 
  serializeTaskLists, 
  serializePlanResult 
} from './plan'

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
      line: 2
    })
    expect(result[0].tasks[1]).toEqual({
      text: 'Task 2',
      checked: true,
      line: 3
    })
    expect(result[0].tasks[2]).toEqual({
      text: 'Task 3',
      checked: false,
      line: 4
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
    
    // First main task with subtasks
    const firstTask = result[0].tasks[0]
    expect(firstTask.text).toBe('Initial setup')
    expect(firstTask.checked).toBe(false)
    expect(firstTask.subtasks).toHaveLength(2)
    
    expect(firstTask.subtasks![0].text).toBe('Install dependencies')
    expect(firstTask.subtasks![0].checked).toBe(false)
    
    expect(firstTask.subtasks![1].text).toBe('Configure environment')
    expect(firstTask.subtasks![1].checked).toBe(true)
    expect(firstTask.subtasks![1].subtasks).toHaveLength(2)
    
    // Nested subtasks
    expect(firstTask.subtasks![1].subtasks![0].text).toBe('Set up .env file')
    expect(firstTask.subtasks![1].subtasks![0].checked).toBe(true)
    expect(firstTask.subtasks![1].subtasks![1].text).toBe('Configure database')
    expect(firstTask.subtasks![1].subtasks![1].checked).toBe(false)
    
    // Second main task with subtasks
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

  it('should handle markdown without task lists', () => {
    const markdown = `
# Regular Heading
This is just regular text.

## Another Heading
- Regular list item (not a task)
- Another regular item
`
    const result = parseTaskLists(markdown)
    expect(result).toHaveLength(0)
  })

  it('should handle mixed content with task lists', () => {
    const markdown = `
# Introduction
This is some introductory text.

- [ ] First task
- [x] Second task

Some more text here.

# Another Section
More text.

- [ ] Another task
  - [ ] Subtask
`
    const result = parseTaskLists(markdown)
    
    expect(result).toHaveLength(2)
    expect(result[0].heading).toBe('Introduction')
    expect(result[0].tasks).toHaveLength(2)
    expect(result[1].heading).toBe('Another Section')
    expect(result[1].tasks).toHaveLength(1)
    expect(result[1].tasks[0].subtasks).toHaveLength(1)
  })

  it('should handle tasks without headings followed by tasks with headings', () => {
    const markdown = `
- [ ] Initial task
- [x] Another initial task

# Organized Section
- [ ] Organized task
`
    const result = parseTaskLists(markdown)
    
    expect(result).toHaveLength(2)
    expect(result[0].heading).toBeUndefined()
    expect(result[0].tasks).toHaveLength(2)
    expect(result[1].heading).toBe('Organized Section')
    expect(result[1].tasks).toHaveLength(1)
  })

  it('should handle multiple heading levels', () => {
    const markdown = `
# Main Section
- [ ] Main task

## Subsection
- [ ] Subsection task

### Sub-subsection
- [ ] Deep task
`
    const result = parseTaskLists(markdown)
    
    expect(result).toHaveLength(3)
    expect(result[0].heading).toBe('Main Section')
    expect(result[1].heading).toBe('Subsection')
    expect(result[2].heading).toBe('Sub-subsection')
  })

  it('should preserve line numbers', () => {
    const markdown = `# Test

- [ ] First task
- [x] Second task
  - [ ] Nested task`
    
    const result = parseTaskLists(markdown)
    
    expect(result[0].tasks[0].line).toBe(3)
    expect(result[0].tasks[1].line).toBe(4)
    expect(result[0].tasks[1].subtasks![0].line).toBe(5)
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

  it('should serialize nested subtasks with proper indentation', () => {
    const task: TaskItem = {
      text: 'Root task',
      checked: false,
      subtasks: [
        {
          text: 'Level 1 task',
          checked: true,
          subtasks: [
            { text: 'Level 2 task A', checked: false },
            { text: 'Level 2 task B', checked: true }
          ]
        }
      ]
    }
    
    const result = serializeTaskItem(task)
    const expected = `- [ ] Root task
  - [x] Level 1 task
    - [ ] Level 2 task A
    - [x] Level 2 task B
`
    expect(result).toBe(expected)
  })

  it('should handle custom indentation levels', () => {
    const task: TaskItem = {
      text: 'Indented task',
      checked: false
    }
    
    const result = serializeTaskItem(task, 2)
    expect(result).toBe('    - [ ] Indented task\n')
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

  it('should serialize a task list with nested tasks', () => {
    const taskList: TaskList = {
      heading: 'Project Setup',
      tasks: [
        {
          text: 'Initial setup',
          checked: false,
          subtasks: [
            { text: 'Install dependencies', checked: true },
            { text: 'Configure environment', checked: false }
          ]
        }
      ]
    }
    
    const result = serializeTaskList(taskList)
    const expected = `# Project Setup
- [ ] Initial setup
  - [x] Install dependencies
  - [ ] Configure environment
`
    expect(result).toBe(expected)
  })
})

describe('serializeTaskLists', () => {
  it('should serialize multiple task lists with proper spacing', () => {
    const taskLists: TaskList[] = [
      {
        heading: 'Setup',
        tasks: [
          { text: 'Install dependencies', checked: true }
        ]
      },
      {
        heading: 'Development',
        tasks: [
          { text: 'Write code', checked: false }
        ]
      }
    ]
    
    const result = serializeTaskLists(taskLists)
    const expected = `# Setup
- [x] Install dependencies

# Development
- [ ] Write code
`
    expect(result).toBe(expected)
  })

  it('should handle empty task lists array', () => {
    const result = serializeTaskLists([])
    expect(result).toBe('')
  })

  it('should handle single task list without extra spacing', () => {
    const taskLists: TaskList[] = [
      {
        heading: 'Single Section',
        tasks: [
          { text: 'Only task', checked: false }
        ]
      }
    ]
    
    const result = serializeTaskLists(taskLists)
    const expected = `# Single Section
- [ ] Only task
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
    
    // Parse the markdown
    const parsed = parseTaskLists(originalMarkdown)
    
    // Serialize it back
    const serialized = serializeTaskLists(parsed)
    
    // Parse again to compare structure
    const reparsed = parseTaskLists(serialized)
    
    // Compare the structures (ignoring line numbers which will be different)
    expect(reparsed).toHaveLength(parsed.length)
    
    for (let i = 0; i < parsed.length; i++) {
      expect(reparsed[i].heading).toBe(parsed[i].heading)
      expect(reparsed[i].tasks).toHaveLength(parsed[i].tasks.length)
      
      // Deep comparison of task structure (excluding line numbers)
      const compareTask = (original: TaskItem, roundTrip: TaskItem) => {
        expect(roundTrip.text).toBe(original.text)
        expect(roundTrip.checked).toBe(original.checked)
        
        if (original.subtasks) {
          expect(roundTrip.subtasks).toHaveLength(original.subtasks.length)
          for (let j = 0; j < original.subtasks.length; j++) {
            compareTask(original.subtasks[j], roundTrip.subtasks![j])
          }
        } else {
          expect(roundTrip.subtasks).toBeUndefined()
        }
      }
      
      for (let j = 0; j < parsed[i].tasks.length; j++) {
        compareTask(parsed[i].tasks[j], reparsed[i].tasks[j])
      }
    }
  })

  it('should handle edge cases in round-trip operations', () => {
    const taskLists: TaskList[] = [
      {
        // No heading
        tasks: [
          { text: 'Orphan task', checked: true }
        ]
      },
      {
        heading: 'Empty section',
        tasks: []
      },
      {
        heading: 'Complex nesting',
        tasks: [
          {
            text: 'Root',
            checked: false,
            subtasks: [
              {
                text: 'Level 1',
                checked: true,
                subtasks: [
                  {
                    text: 'Level 2',
                    checked: false,
                    subtasks: [
                      { text: 'Level 3', checked: true }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
    
    const serialized = serializeTaskLists(taskLists)
    const reparsed = parseTaskLists(serialized)
    
    // Should maintain the same structure
    expect(reparsed).toHaveLength(2) // Empty sections are not preserved in parsing
    expect(reparsed[0].heading).toBeUndefined()
    expect(reparsed[1].heading).toBe('Complex nesting')
    expect(reparsed[1].tasks[0].subtasks![0].subtasks![0].subtasks![0].text).toBe('Level 3')
  })
})  