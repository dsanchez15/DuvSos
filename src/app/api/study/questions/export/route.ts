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

    const questions = await prisma.studyQuestion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const exportData = questions.map((q) => ({
      question: q.question,
      answer: q.directAnswer,
      topic: q.topic,
      type: q.type === 'multiple_choice' ? 'multiple-choice' : 'direct',
      categoryId: q.categoryId,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      supportsBothModes: q.supportsBothModes,
    }))

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Error exporting questions:', error)
    return NextResponse.json({ error: 'Failed to export questions' }, { status: 500 })
  }
}
