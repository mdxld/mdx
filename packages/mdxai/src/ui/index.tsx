import React, { useState, useEffect } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import type { StreamTextResult } from 'ai'
import PQueue from 'p-queue'

export const StreamingText = ({ stream, onComplete }: { stream: StreamTextResult<never, string>; onComplete?: (fullText: string) => void }) => {
  const [text, setText] = useState('')

  useEffect(() => {
    let fullText = ''

    const readStream = async () => {
      for await (const chunk of stream.textStream) {
        fullText += chunk
        setText(fullText)
      }

      if (onComplete) {
        onComplete(fullText)
      }
    }

    readStream()
  }, [stream, onComplete])

  return (
    <Box flexDirection='column'>
      <Text>{text}</Text>
    </Box>
  )
}

export const TaskList = ({
  items,
  activeIndex = -1,
}: {
  items: Array<{ title: string; status: 'pending' | 'active' | 'completed' | 'error' }>
  activeIndex?: number
}) => {
  return (
    <Box flexDirection='column' marginY={1}>
      {items.map((item, index) => (
        <Box key={index}>
          <Text>
            {item.status === 'completed' ? '✓ ' : item.status === 'error' ? '✗ ' : item.status === 'active' ? '→ ' : '  '}
            <Text color={item.status === 'completed' ? 'green' : item.status === 'error' ? 'red' : item.status === 'active' ? 'blue' : 'white'}>
              {item.title}
            </Text>
          </Text>
        </Box>
      ))}
    </Box>
  )
}

export class QueueManager {
  private queue: PQueue
  private tasks: Array<{ title: string; status: 'pending' | 'active' | 'completed' | 'error' }> = []
  private listeners: Array<(tasks: typeof this.tasks) => void> = []

  constructor(concurrency = 20) {
    this.queue = new PQueue({ concurrency })

    this.queue.on('active', () => {
      this.notifyListeners()
    })
  }

  addTask(title: string, task: () => Promise<any>): Promise<any> {
    const taskIndex = this.tasks.length
    this.tasks.push({ title, status: 'pending' })
    this.notifyListeners()

    return this.queue.add(async () => {
      try {
        this.tasks[taskIndex].status = 'active'
        this.notifyListeners()

        const result = await task()

        this.tasks[taskIndex].status = 'completed'
        this.notifyListeners()

        return result
      } catch (error) {
        this.tasks[taskIndex].status = 'error'
        this.notifyListeners()
        throw error
      }
    })
  }

  subscribe(listener: (tasks: typeof this.tasks) => void): () => void {
    this.listeners.push(listener)
    listener(this.tasks)

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener([...this.tasks])
    }
  }

  get size() {
    return this.queue.size
  }

  get pending() {
    return this.queue.pending
  }
}

export const QueueStatus = ({ queue }: { queue: QueueManager }) => {
  const [tasks, setTasks] = useState<Array<{ title: string; status: 'pending' | 'active' | 'completed' | 'error' }>>([])
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    return queue.subscribe((tasks) => {
      setTasks(tasks)
      const activeIndex = tasks.findIndex((task) => task.status === 'active')
      setActiveIndex(activeIndex)
    })
  }, [queue])

  return (
    <Box flexDirection='column'>
      <Box marginBottom={1}>
        <Text>Queue Status: </Text>
        <Text color='blue'>{queue.pending}</Text>
        <Text> active, </Text>
        <Text color='yellow'>{queue.size}</Text>
        <Text> pending</Text>
      </Box>
      <TaskList items={tasks} activeIndex={activeIndex} />
    </Box>
  )
}
