import React from 'react'
import { Text } from 'ink'
import zod from 'zod'

export const options = zod.object({
  prompt: zod.string()
    // .default('Hello, how are you?')
    .describe('What do you want to ask the AI?'),
})

type Props = {
  options: zod.infer<typeof options>
}

export default function Index({ options }: Props) {
  return (
    <Text>
      {options.prompt ?? 'Hello, how are you?'}
    </Text>
  )
}
