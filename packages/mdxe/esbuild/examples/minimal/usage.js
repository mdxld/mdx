import content from './dist/content.mjs'
import React from 'react'
import { renderToString } from 'react-dom/server'

const HelloComponent = content.Hello.default

console.log('Frontmatter:', content.Hello.data)

console.log('Raw markdown:', content.Hello.markdown.substring(0, 100) + '...')

const html = renderToString(React.createElement(HelloComponent))
console.log('Rendered HTML:', html)

console.log('Available content:', Object.keys(content))

// Access the Hello MDX content
const hello = content.Hello
console.log('\n=== Hello MDX ===')
console.log('Title:', hello.data.title)
console.log('Description:', hello.data.description)

// Access the Startup Example content with code blocks
const startup = content.StartupExample
if (startup) {
  console.log('\n=== Startup Example ===')
  console.log('Title:', startup.data.title)
  console.log('Description:', startup.data.description)
  
  console.log('\n--- Executable Code Blocks ---')
  startup.code.forEach((block, index) => {
    console.log(`Block ${index + 1} (${block.lang}${block.meta ? ` ${block.meta}` : ''}):`)
    console.log(block.value.substring(0, 100) + (block.value.length > 100 ? '...' : ''))
    console.log('---')
  })
  
  console.log('\n--- Test Code Blocks ---')
  startup.test.forEach((block, index) => {
    console.log(`Test Block ${index + 1} (${block.lang}${block.meta ? ` ${block.meta}` : ''}):`)
    console.log(block.value)
    console.log('---')
  })
}
