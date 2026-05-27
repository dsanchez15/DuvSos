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
    const type = searchParams.get('type')
    const searchText = searchParams.get('search')
    const supportsBothModes = searchParams.get('supportsBothModes')

    const where: any = { userId }
    if (categoryId) where.categoryId = parseInt(categoryId)
    if (topic) where.topic = topic
    if (type) where.type = type
    if (supportsBothModes !== null) where.supportsBothModes = supportsBothModes === 'true'
    if (searchText) {
      where.question = { contains: searchText, mode: 'insensitive' }
    }

    const questions = await prisma.studyQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(questions)
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

    const question = await prisma.studyQuestion.create({
      data: {
        ...body,
        type,
        userId,
      },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error('Error creating study question:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}
