import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

export async function POST(
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

    const answer = await prisma.studySessionAnswer.create({
      data: {
        sessionId: id,
        questionId: body.questionId,
        questionText: body.questionText,
        userAnswer: body.userAnswer,
        correctAnswer: body.correctAnswer,
        isCorrect: body.isCorrect,
        modeUsed: body.modeUsed,
        timeSpent: body.timeSpent,
      },
    })

    await prisma.studySession.update({
      where: { id },
      data: {
        currentIndex: { increment: 1 },
        totalTimeSpent: { increment: body.timeSpent },
        lastActivityAt: new Date(),
      },
    })

    return NextResponse.json(answer, { status: 201 })
  } catch (error) {
    console.error('Error saving answer:', error)
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
  }
}
