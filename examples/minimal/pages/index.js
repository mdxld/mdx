import { useState, useEffect } from 'react'
import * as React from 'react'

const components = {
  h1: (props) => <h1 className='text-3xl font-bold mb-4' {...props} />,
  h2: (props) => <h2 className='text-2xl font-bold mb-3' {...props} />,
  h3: (props) => <h3 className='text-xl font-bold mb-2' {...props} />,
  p: (props) => <p className='mb-4' {...props} />,
  ul: (props) => <ul className='list-disc pl-5 mb-4' {...props} />,
  ol: (props) => <ol className='list-decimal pl-5 mb-4' {...props} />,
  li: (props) => <li className='mb-1' {...props} />,
  code: (props) => <code className='bg-gray-100 px-1 rounded' {...props} />,
  pre: (props) => <pre className='bg-gray-100 p-4 rounded mb-4 overflow-x-auto' {...props} />,
}

export default function Home() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch('/api/mdx?path=/')
        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        setContent(data.htmlContent || 'No content available')
      } catch (err) {
        console.error('Error loading content:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  if (loading) {
    return <div className='p-8'>Loading...</div>
  }

  if (error) {
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold text-red-500'>Error loading content</h1>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className='max-w-3xl mx-auto p-8'>
      <div className='mdx-content' dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}
