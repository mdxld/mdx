import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No valid file uploaded' }, { status: 400 })
    }

    if (file.type !== 'application/json') {
      return NextResponse.json({ error: 'File must be JSON format' }, { status: 400 })
    }

    const fileBuffer = await file.arrayBuffer()

    const blob = await put(file.name, fileBuffer, {
      access: 'public', // This is a design decision that needs input
    })

    return NextResponse.json(blob)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 })
  }
}
