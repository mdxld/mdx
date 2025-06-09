import 'dotenv/config'
import { mdx } from './mdx'

describe('mdx', () => {
  it('should generate a mdx file', async () => {
    const result = await mdx`fizzBuzz`
    console.log(result)
  })
})
