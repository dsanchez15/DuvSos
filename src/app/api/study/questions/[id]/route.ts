import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers()
    const userIdHeader = headersList.get('x-user-id')
    if (!userIdHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = parseInt(userIdHeader, 10)
    const { id } = await params
    const body = await request.json()

    if (body.type === 'multiple-choice') {
      body.type = 'multiple_choice'
    }

    if (body.topic && !body.topicId) {
      const normalizedName = body.topic.toLowerCase().trim()
      const topic = await prisma.topic.findUnique({
        where: { userId_normalizedName: { userId, normalizedName } },
      })
      if (topic) {
        body.topicId = topic.id
      } else {
        return NextResponse.json({ error: `Topic '${body.topic}' not found` }, { status: 400 })
      }
    }

    // Remove topic string to avoid Prisma validation error
    delete body.topic

    const question = await prisma.question.updateMany({
      where: { id, userId },
      data: body,
    })

    if (question.count === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const updated = await prisma.question.findUnique({ where: { id } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating study question:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers()
    const userIdHeader = headersList.get('x-user-id')
    if (!userIdHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = parseInt(userIdHeader, 10)
    const { id } = await params

    await prisma.question.deleteMany({
      where: { id, userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting study question:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}
