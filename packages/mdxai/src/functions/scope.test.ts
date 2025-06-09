import 'dotenv/config'
import { scope } from './scope'

describe('scope', () => {
  it('should scope a project', async () => {
    const result = await scope`A project to create a new website for a local business.`
    console.log(result)
  })
})
