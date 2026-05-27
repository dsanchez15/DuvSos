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

    const sessions = await prisma.session.findMany({
      where: { userId, status: { in: ['completed', 'abandoned'] } },
      include: { answers: true },
      orderBy: { lastActivityAt: 'desc' },
    })

    const results = sessions.map((s) => {
      const correctCount = s.answers.filter((a) => a.isCorrect).length
      return {
        id: s.id,
        sessionId: s.id,
        config: s.config,
        totalQuestions: s.answers.length,
        correctCount,
        incorrectCount: s.answers.length - correctCount,
        accuracyPercentage: s.answers.length > 0 ? Math.round((correctCount / s.answers.length) * 100) : 0,
        totalTimeSpent: s.totalTimeSpent,
        completedAt: s.lastActivityAt,
      }
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error fetching session results:', error)
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}
