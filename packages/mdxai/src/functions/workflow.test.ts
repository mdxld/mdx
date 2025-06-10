import 'dotenv/config'
import { workflow } from './workflow'

describe('workflow', () => {
  it('should generate a workflow', async () => {
    const result = await workflow`to flesh out a startup idea and validate it with the Disciplined Entrepreneurship framework`
    console.log(result)
  })

  it('should generate a workflow', async () => {
    const result = await workflow`to verify auto lender stipulations`
    console.log(result)
  })

})
