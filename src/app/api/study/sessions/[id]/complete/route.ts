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

    const session = await prisma.session.updateMany({
      where: { id, userId },
      data: {
        status: body.status,
        lastActivityAt: new Date(),
      },
    })

    if (session.count === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const updated = await prisma.session.findUnique({
      where: { id },
      include: { answers: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error completing session:', error)
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 })
  }
}
