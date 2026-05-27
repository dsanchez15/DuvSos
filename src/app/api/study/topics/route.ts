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

    const topics = await prisma.studyTopic.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(topics)
  } catch (error) {
    console.error('Error fetching study topics:', error)
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
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
    const name = typeof body.name === 'string' ? body.name.trim() : ''

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const normalizedName = name.toLowerCase()

    const existing = await prisma.studyTopic.findUnique({
      where: { userId_normalizedName: { userId, normalizedName } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Topic already exists' }, { status: 409 })
    }

    const topic = await prisma.studyTopic.create({
      data: {
        name,
        normalizedName,
        userId,
      },
    })

    return NextResponse.json(topic, { status: 201 })
  } catch (error) {
    console.error('Error creating study topic:', error)
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
  }
}
