import React from 'react'
import chalk from 'chalk'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import Index from './commands/greet.js'

describe('Index component', () => {
	it('should greet user', () => {
		const {lastFrame} = render(<Index options={{name: 'Jane'}} />)
		console.log(lastFrame())

		expect(lastFrame()).toBe(`Hello, ${chalk.green('Jane')}`)
	})
})
