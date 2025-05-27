import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { registerComponent, registerComponents, getAllComponents, mergeComponents } from './component-loader'

describe('Component Loader', () => {
  beforeEach(() => {
    globalThis.__mdxComponentRegistry = undefined
  })

  afterEach(() => {
    globalThis.__mdxComponentRegistry = undefined
  })

  describe('registerComponent', () => {
    it('should register a single component', async () => {
      const TestComponent = () => React.createElement('div', null, 'Test')
      registerComponent('test', TestComponent)

      const components = await getAllComponents()
      expect(components.test).toBe(TestComponent)
    })

    it('should throw an error if component is not a function', () => {
      expect(() => {
        registerComponent('test', 'not-a-component' as any)
      }).toThrow('Component for "test" must be a React component function')
    })
  })

  describe('registerComponents', () => {
    it('should register multiple components at once', async () => {
      const TestComponent1 = () => React.createElement('div', null, 'Test 1')
      const TestComponent2 = () => React.createElement('div', null, 'Test 2')

      registerComponents({
        test1: TestComponent1,
        test2: TestComponent2,
      })

      const components = await getAllComponents()
      expect(components.test1).toBe(TestComponent1)
      expect(components.test2).toBe(TestComponent2)
    })
  })

  describe('getAllComponents', () => {
    it('should merge file-based and programmatically registered components', async () => {
      const originalLoadMdxComponents = await import('./component-loader').then((m) => m.loadMdxComponents)

      const mockLoadMdxComponents = vi.fn().mockResolvedValue({
        fileComponent: () => React.createElement('div', null, 'File Component'),
      })

      vi.spyOn(await import('./component-loader'), 'loadMdxComponents').mockImplementation(mockLoadMdxComponents)

      const ProgrammaticComponent = () => React.createElement('div', null, 'Programmatic')
      registerComponent('programmatic', ProgrammaticComponent)

      const components = await getAllComponents()

      expect(components.programmatic).toBe(ProgrammaticComponent)

      vi.mocked(await import('./component-loader')).loadMdxComponents.mockRestore()
    })
  })

  describe('mergeComponents', () => {
    it('should merge component objects with precedence to overrides', () => {
      const DefaultComponent = () => React.createElement('div', null, 'Default')
      const OverrideComponent = () => React.createElement('div', null, 'Override')

      const defaults = {
        test: DefaultComponent,
        unchanged: DefaultComponent,
      }

      const overrides = {
        test: OverrideComponent,
        new: OverrideComponent,
      }

      const result = mergeComponents(defaults, overrides)

      expect(result.test).toBe(OverrideComponent)
      expect(result.unchanged).toBe(DefaultComponent)
      expect(result.new).toBe(OverrideComponent)
    })
  })
})
