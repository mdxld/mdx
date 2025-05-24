import React, { useState, useEffect } from 'react'
import { render, Box, Text } from 'ink'
import { StreamingText, TaskList, QueueManager, QueueStatus } from './index.js'
import type { StreamTextResult } from 'ai'
import { CoreMessage } from 'ai'
import { generateContentStream, generateListStream, generateResearchStream } from '../llmService.js'

export const App = ({ command, options }: { command: string; options: Record<string, any> }) => {
  const [output, setOutput] = useState<string>('')
  const [stream, setStream] = useState<StreamTextResult<never, string> | null>(null)
  const [queueManager] = useState(() => new QueueManager(options.concurrency || 20))
  const [tasks, setTasks] = useState<Array<{ title: string; status: 'pending' | 'active' | 'completed' | 'error' }>>([])

  useEffect(() => {
    const runCommand = async () => {
      try {
        switch (command) {
          case 'generate':
            const generateStream = await generateContentStream({
              messages: [
                { role: 'system', content: options.systemMessage || 'You are a helpful AI assistant.' },
                { role: 'user', content: options.prompt },
              ],
            })
            setStream(generateStream)
            break

          case 'list':
            const listStream = await generateListStream(options.prompt)
            setStream(listStream)
            break

          case 'research':
            const researchStream = await generateResearchStream(options.prompt)
            setStream(researchStream)
            break

          case 'list+generate':
            const listResult = await generateListStream(options.prompt)
            let listItems = ''

            for await (const chunk of listResult.textStream) {
              listItems += chunk
            }

            const items = listItems
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => /^\d+\./.test(line))
              .map((line) => line.replace(/^\d+\.\s*/, '').trim())

            const generatedItems: string[] = []

            for (const item of items) {
              queueManager.addTask(`Generating: ${item}`, async () => {
                const itemStream = await generateContentStream({
                  messages: [
                    { role: 'system', content: 'Generate content for the following topic:' },
                    { role: 'user', content: item },
                  ],
                })

                let itemContent = ''
                for await (const chunk of itemStream.textStream) {
                  itemContent += chunk
                }

                generatedItems.push(`## ${item}\n\n${itemContent}\n\n`)
                setOutput(generatedItems.join(''))
              })
            }
            break

          case 'list+research':
            const researchListResult = await generateListStream(options.prompt)
            let researchListItems = ''

            for await (const chunk of researchListResult.textStream) {
              researchListItems += chunk
            }

            const researchItems = researchListItems
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => /^\d+\./.test(line))
              .map((line) => line.replace(/^\d+\.\s*/, '').trim())

            const researchResults: string[] = []

            for (const item of researchItems) {
              queueManager.addTask(`Researching: ${item}`, async () => {
                const itemStream = await generateResearchStream(item)

                let itemContent = ''
                for await (const chunk of itemStream.textStream) {
                  itemContent += chunk
                }

                researchResults.push(`## ${item}\n\n${itemContent}\n\n`)
                setOutput(researchResults.join(''))
              })
            }
            break

          default:
            setOutput(`Unknown command: ${command}`)
        }
      } catch (error) {
        setOutput(`Error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    runCommand()

    return () => {}
  }, [command, options, queueManager])

  useEffect(() => {
    return queueManager.subscribe((newTasks) => {
      setTasks(newTasks)
    })
  }, [queueManager])

  return (
    <Box flexDirection='column'>
      {stream ? (
        <StreamingText stream={stream} onComplete={(text) => setOutput(text)} />
      ) : (
        <>
          {tasks.length > 0 && (
            <Box flexDirection='column' marginBottom={1}>
              <QueueStatus queue={queueManager} />
            </Box>
          )}
          {output && <Text>{output}</Text>}
        </>
      )}
    </Box>
  )
}

export function renderApp(command: string, options: Record<string, any>) {
  const { unmount } = render(<App command={command} options={options} />)
  return unmount
}
