import content from './dist/content.mjs'
import React from 'react'
import { renderToString } from 'react-dom/server'

const HelloComponent = content.Hello.default

console.log('Frontmatter:', content.Hello.data)

console.log('Raw markdown:', content.Hello.markdown.substring(0, 100) + '...')

const html = renderToString(React.createElement(HelloComponent))
console.log('Rendered HTML:', html)
