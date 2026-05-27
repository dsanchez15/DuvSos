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

    const question = await prisma.studyQuestion.updateMany({
      where: { id, userId },
      data: body,
    })

    if (question.count === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const updated = await prisma.studyQuestion.findUnique({ where: { id } })
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

    await prisma.studyQuestion.deleteMany({
      where: { id, userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting study question:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}
