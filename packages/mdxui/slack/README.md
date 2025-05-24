# `@mdxui/slack`

Here’s a sketch of how you could ship a fully-prebuilt Next.js route in your `@mdxui/slack` package so that a user’s only code is:

```ts
// app/api/webhooks/slack/route.ts
export * from '@mdxui/slack'
```

–––

## 1. What the user’s route file looks like

In Next.js 13’s App Router, any file that exports `GET` and/or `POST` handlers becomes an HTTP endpoint. By having your package export those handlers, the user can simply re-export them:

```ts
// user’s app/api/webhooks/slack/route.ts
export * from '@mdxui/slack'
```

That’s it—no other boilerplate or configuration.

–––

## 2. Package entry point: exporting Next.js handlers

In your `@mdxui/slack` package’s `src/index.ts`, you’d do:

```ts
export { GET, POST } from './route'
export * from './hooks'
export * from './blocks'
```

- `GET` handles Slack’s URL‐verification challenge
- `POST` handles all interactive payloads (block_actions, view_submissions, slash_commands, etc.)
- You also re-export your hook APIs (`useBlockAction`, `useSlashCommand`, …) and your UI primitives (`Blocks`, `Section`, `Modal`, …) so users can import them from `@mdxui/slack`.

–––

## 3. Implementing the route handlers

### route.ts (in `@mdxui/slack`)

```ts
// src/route.ts
import { NextResponse } from 'next/server'
import { verifySlackRequest, parseSlackPayload } from './internals/signature'
import { dispatch } from './internals/router'

// Slack’s URL↔challenge handshake
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const challenge = searchParams.get('challenge')
  if (challenge) return NextResponse.json({ challenge })
  return new NextResponse('Not Found', { status: 404 })
}

// All Slack interactive & event payloads arrive here
export async function POST(req: Request) {
  // 1. Verify signature
  const raw = await req.text()
  if (!verifySlackRequest(req.headers, raw)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 2. Parse the JSON (or form-encoded) payload
  const payload = parseSlackPayload(raw)

  // 3. Dispatch to whatever handlers your user has registered
  const result = await dispatch(payload)

  // 4. Acknowledge to Slack
  // Slack expects a 200 OK within 3 seconds. If `dispatch` returned a
  // JSON response (e.g. an ephemeral message), include it; otherwise
  // send an empty 200.
  return result ? NextResponse.json(result) : new NextResponse(null, { status: 200 })
}
```

- **`verifySlackRequest`** checks the signing secret against the `X-Slack-Signature` header.
- **`parseSlackPayload`** handles both JSON and `application/x-www-form-urlencoded` bodies.
- **`dispatch`** is your central router that looks at `payload.type` (e.g. `"block_actions"`, `"view_submission"`, `"slash_commands"`) or the `action_id` or `callback_id` inside it, and invokes the user’s registered callbacks.

–––

## 4. A tiny interactive “hook” system

Inside your package you can offer hooks that the user calls at top-level, just like React hooks:

```ts
// src/hooks.ts
type BlockActionHandler = (ctx: { ack(): Promise<void>; payload: BlockActionPayload; client: SlackWebClient }) => Promise<void>

// registry for action_id → handler
const blockActionRegistry = new Map<string, BlockActionHandler>()

export function useBlockAction(actionId: string, handler: BlockActionHandler) {
  blockActionRegistry.set(actionId, handler)
}

// similar APIs for useSlashCommand, useViewSubmission, etc.

export async function dispatch(payload: any) {
  switch (payload.type) {
    case 'block_actions': {
      const action = payload.actions[0]
      const handler = blockActionRegistry.get(action.action_id)
      if (!handler) break
      await handler({
        ack: async () => {
          /* send ack HTTP response or empty JSON */
        },
        payload,
        client: new SlackWebClient(process.env.SLACK_BOT_TOKEN!),
      })
      break
    }
    // … handle other types …
  }
  // if you want to return a JSON body (e.g. ephemeral reply), you can
  // return { replace_original: false, text: '…' }
}
```

1. **At startup** your user’s code (anywhere they import `useBlockAction`) runs:

   ```ts
   import { useBlockAction, Blocks, Section, Button } from '@mdxui/slack'

   // Register a click handler
   useBlockAction('my_button', async ({ ack, payload, client }) => {
     await ack()
     // e.g. update a message, open a modal…
     await client.chat.postEphemeral({ … })
   })

   // They can also declare UI templates in JSX:
   export const MyMessage = () => (
     <Blocks>
       <Section>Click the button!</Section>
       <Actions>
         <Button actionId="my_button">Press me</Button>
       </Actions>
     </Blocks>
   )
   ```

2. **When Slack pings** your `POST` route, you `dispatch(payload)`, which finds `"my_button"` in your registry and calls the handler.

3. **Because Next.js bundles all imports top-level**, your `useBlockAction` calls run exactly once on cold-start, registering handlers before any request hits.

–––

## 5. Putting it all together

- **Package export**

  ```text
  @mdxui/slack/
  ├─ src/
  │  ├─ route.ts       ← exports GET & POST
  │  ├─ hooks.ts       ← exports `useBlockAction`, `useSlashCommand`, …
  │  ├─ blocks.ts      ← exports `<Blocks>`, `<Section>`, `<Button>`, …
  │  └─ internals/     ← signature, payload parsing, router
  └─ index.ts          ← re-exports from route.ts, hooks.ts, blocks.ts
  ```

- **User side**

  ```ts
  // app/api/webhooks/slack/route.ts
  export * from '@mdxui/slack'

  // somewhere in your code…
  import { useSlashCommand, Blocks, Section } from '@mdxui/slack'

  useSlashCommand('/hello', async ({ ack, payload, client }) => {
    await ack()
    await client.chat.postMessage({
      channel: payload.channel_id,
      blocks: JSXSlack(<Section>Hello, world!</Section>)
    })
  })
  ```

And that’s all they need. The heavy lifting—Next.js route wiring, signature verification, Slack JSON↔JSX conversion, callback registry, handler dispatch—is all hidden inside `@mdxui/slack`.
