import { describe, it, expect } from 'vitest'
import { parseTaskLists, TaskList, TaskItem } from './plan'

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