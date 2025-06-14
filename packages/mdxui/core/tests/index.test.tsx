import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Button } from '../components/button'
import { Card } from '../components/card'
import { Gradient } from '../components/gradient'

describe('exported components', () => {
  it('renders Button', () => {
    render(<Button>Click me</Button>)
    const button = document.querySelector('button')
    expect(button).not.toBeNull()
  })

  it('renders Card', () => {
    render(
      <Card title="Test" href="https://example.com">
        Card body
      </Card>
    )
    const link = document.querySelector('a')
    expect(link?.getAttribute('href')).to.contain('https://example.com')
    expect(screen.getByText('Card body')).not.toBeNull()
  })

  it('renders Gradient', () => {
    const { container } = render(<div><Gradient /></div>)
    expect(container.querySelector('span')).not.toBeNull()
  })
})
