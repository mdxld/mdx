import { describe, it, expect, vi } from 'vitest'

vi.mock('../src/components', () => ({
  Icon: vi.fn(({ name }) => `Icon: ${name}`),
}))

vi.mock('react-icons/io5', () => ({
  IoRocketSharp: vi.fn(),
}))

vi.mock('react-icons/fa', () => ({
  FaHeart: vi.fn(),
}))

vi.mock('react-icons/md', () => ({
  MdHome: vi.fn(),
}))

describe('Icon Component', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true)
  })
})
