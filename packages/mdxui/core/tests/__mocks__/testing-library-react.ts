import React from 'react'

function createDomNode(element: React.ReactElement): HTMLElement {
  if (typeof element.type === 'function') {
    return createDomNode(element.type(element.props))
  }
  const node = document.createElement(element.type as string)
  const { children, className, ...rest } = element.props || {}
  if (className) node.setAttribute('class', className)
  Object.entries(rest).forEach(([k, v]) => {
    if (v != null) node.setAttribute(k, String(v))
  })
  React.Children.toArray(children).forEach((child) => {
    if (typeof child === 'string') {
      node.appendChild(document.createTextNode(child))
    } else {
      node.appendChild(createDomNode(child as React.ReactElement))
    }
  })
  return node
}

export function render(ui: React.ReactElement) {
  const container = document.createElement('div')
  container.appendChild(createDomNode(ui))
  document.body.appendChild(container)
  return { container }
}

export const screen = {
  getByRole(role: string) {
    return document.querySelector(`[role="${role}"]`) as HTMLElement
  },
  getByText(text: string) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
    while (walker.nextNode()) {
      const el = walker.currentNode as HTMLElement
      if (el.textContent && el.textContent.includes(text)) return el
    }
    throw new Error('Element not found')
  },
  getByTestId(id: string) {
    return document.querySelector(`[data-testid="${id}"]`) as HTMLElement
  }
}
