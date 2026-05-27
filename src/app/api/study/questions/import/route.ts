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

    const summary = { imported: 0, ignored: 0, errors: [] as string[] }
    const items = Array.isArray(body) ? body : [body]

    const categories = await prisma.category.findMany({ where: { userId } })
    const validCategoryIds = new Set(categories.map((c) => c.id))

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const questionText = typeof item.question === 'string' ? item.question.trim() : ''
      const answer = typeof item.answer === 'string' ? item.answer.trim() : ''
      const topicName = typeof item.topic === 'string' ? item.topic.trim() : ''
      const categoryId = typeof item.categoryId === 'number' ? item.categoryId : null
      const type = item.type === 'multiple-choice' || item.type === 'direct' ? item.type : null
      const supportsBothModes = typeof item.supportsBothModes === 'boolean' ? item.supportsBothModes : false

      if (!questionText || !answer || !topicName || !type) {
        summary.ignored++
        summary.errors.push(`Item ${i + 1}: Missing required fields`)
        continue
      }

      if (categoryId !== null && !validCategoryIds.has(categoryId)) {
        summary.ignored++
        summary.errors.push(`Item ${i + 1}: Category ${categoryId} does not exist`)
        continue
      }

      let options: string[] = []
      let correctOptionIndex: number | null = null

      if (type === 'multiple-choice') {
        const opts = Array.isArray(item.options) ? item.options.filter((o: unknown): o is string => typeof o === 'string') : []
        if (opts.length !== 4 || opts.some((o: string) => !o.trim())) {
          summary.ignored++
          summary.errors.push(`Item ${i + 1}: Multiple-choice requires exactly 4 non-empty options`)
          continue
        }
        options = opts.map((o: string) => o.trim())
        const idx = typeof item.correctOptionIndex === 'number' ? item.correctOptionIndex : null
        if (idx === null || idx < 0 || idx > 3) {
          summary.ignored++
          summary.errors.push(`Item ${i + 1}: Invalid correctOptionIndex`)
          continue
        }
        correctOptionIndex = idx
      }

      // Buscar o crear el topic
      const normalizedName = topicName.toLowerCase()
      let topic = await prisma.topic.findUnique({
        where: { userId_normalizedName: { userId, normalizedName } },
      })

      if (!topic) {
        topic = await prisma.topic.create({
          data: {
            name: topicName,
            normalizedName,
            userId,
          },
        })
      }

      await prisma.question.create({
        data: {
          question: questionText,
          categoryId,
          topicId: topic.id,
          type: type === 'multiple-choice' ? 'multiple_choice' : 'direct',
          directAnswer: answer,
          options: options.length ? options : [],
          correctOptionIndex,
          supportsBothModes,
          userId,
        },
      })
      summary.imported++
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error importing questions:', error)
    return NextResponse.json({ error: 'Failed to import questions' }, { status: 500 })
  }
}
