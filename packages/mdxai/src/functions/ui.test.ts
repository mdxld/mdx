import 'dotenv/config'
import { ui } from './ui'

describe('ui', () => {
  it('should generate a ui component', async () => {
    const result = await ui`landing page hero section`
    console.log(result)
  })
})
