import React from 'react'
import { render } from 'ink-testing-library'
import { describe, it, expect } from 'vitest'
import { ExecutionResults } from '../src/ExecutionResults'
import type { CodeExecutionResult } from '../src/code-execution'

describe('ExecutionResults Component', () => {
  it('should render successful execution results', () => {
    const results: CodeExecutionResult[] = [
      {
        success: true,
        output: 'Hello, world!',
      },
    ]

    const { lastFrame } = render(<ExecutionResults results={results} />)
    expect(lastFrame()).toContain('Code Execution Results')
    expect(lastFrame()).toContain('Block 1')
    expect(lastFrame()).toContain('Hello, world!')
  })

  it('should render error execution results', () => {
    const results: CodeExecutionResult[] = [
      {
        success: false,
        error: 'Test error message',
      },
    ]

    const { lastFrame } = render(<ExecutionResults results={results} />)
    expect(lastFrame()).toContain('Code Execution Results')
    expect(lastFrame()).toContain('Block 1')
    expect(lastFrame()).toContain('Error: Test error message')
  })

  it('should render nothing when results array is empty', () => {
    const results: CodeExecutionResult[] = []
    const { lastFrame } = render(<ExecutionResults results={results} />)
    expect(lastFrame()).toBe('')
  })

  it('should render multiple execution results', () => {
    const results: CodeExecutionResult[] = [
      {
        success: true,
        output: 'First output',
      },
      {
        success: false,
        error: 'Second block error',
      },
      {
        success: true,
        output: 'Third output',
      },
    ]

    const { lastFrame } = render(<ExecutionResults results={results} />)
    expect(lastFrame()).toContain('Block 1')
    expect(lastFrame()).toContain('First output')
    expect(lastFrame()).toContain('Block 2')
    expect(lastFrame()).toContain('Error: Second block error')
    expect(lastFrame()).toContain('Block 3')
    expect(lastFrame()).toContain('Third output')
  })
})
