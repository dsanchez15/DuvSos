import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const userIdHeader = headersList.get('x-user-id')
    if (!userIdHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = parseInt(userIdHeader, 10)
    const body = await request.json()

    await prisma.session.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'abandoned' },
    })

    const session = await prisma.session.create({
      data: {
        userId,
        config: body.config,
        status: 'active',
        questionIds: body.questionIds,
        currentIndex: 0,
        totalTimeSpent: 0,
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating study session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
