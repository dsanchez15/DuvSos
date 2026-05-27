import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const userIdHeader = headersList.get('x-user-id')
    if (!userIdHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = parseInt(userIdHeader, 10)
    const { searchParams } = new URL(request.url)

    const categoryId = searchParams.get('categoryId')
    const topic = searchParams.get('topic')
    const mode = searchParams.get('mode')
    const searchText = searchParams.get('search')

    const where: any = { userId }
    if (categoryId) where.categoryId = parseInt(categoryId)
    if (mode) {
      if (mode === 'dual') {
        where.supportsBothModes = true
      } else if (mode === 'direct') {
        where.OR = [
          { type: 'direct' },
          { supportsBothModes: true },
        ]
      } else if (mode === 'multiple-choice') {
        where.OR = [
          { type: 'multiple_choice' },
          { supportsBothModes: true },
        ]
      }
    }
    if (searchText) {
      where.question = { contains: searchText, mode: 'insensitive' }
    }

    if (topic) {
      const topicRecord = await prisma.topic.findFirst({
        where: { userId, normalizedName: topic.toLowerCase() },
      })
      if (topicRecord) {
        where.topicId = topicRecord.id
      }
    }

    const questions = await prisma.question.findMany({
      where,
      include: { topic: true },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = questions.map((q) => ({
      ...q,
      type: q.type === 'multiple_choice' ? 'multiple-choice' : q.type,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching study questions:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const userIdHeader = headersList.get('x-user-id')
    if (!userIdHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = parseInt(userIdHeader, 10)
    const body = await request.json()

    const type = body.type === 'multiple-choice' ? 'multiple_choice' : (body.type === 'direct' ? 'direct' : 'direct')

    let topicId = body.topicId
    if (!topicId && body.topic) {
      const normalizedName = body.topic.toLowerCase().trim()
      const topic = await prisma.topic.findUnique({
        where: { userId_normalizedName: { userId, normalizedName } },
      })
      if (topic) {
        topicId = topic.id
      } else {
        return NextResponse.json({ error: `Topic '${body.topic}' not found` }, { status: 400 })
      }
    }

    if (!topicId) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    // Remove `topic` string to avoid Prisma validation error
    const { topic: _topic, ...rest } = body

    const question = await prisma.question.create({
      data: {
        ...rest,
        type,
        topicId,
        userId,
      },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error('Error creating study question:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}
