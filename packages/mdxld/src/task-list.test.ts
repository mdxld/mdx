import { describe, it, expect } from 'vitest'
import { parseTaskList } from './task-list.js'

describe('parseTaskList', () => {
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
