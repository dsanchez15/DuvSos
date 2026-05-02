import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

async function getUserId() {
  const headersList = await headers()
  const userIdHeader = headersList.get('x-user-id')
  if (!userIdHeader) return null
  return parseInt(userIdHeader, 10)
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')

    const where: any = { userId }
    if (status) where.status = status
    if (category) where.category = category
    if (priority) where.priority = priority

    const goals = await prisma.goal.findMany({
      where,
      include: { milestones: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ goals, total: goals.length })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, description, category, priority, deadline, estimatedHours, milestones } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!category || !['PROFESIONAL', 'PERSONAL'].includes(category)) {
      return NextResponse.json({ error: 'Valid category is required (PROFESIONAL or PERSONAL)' }, { status: 400 })
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim(),
        category,
        priority: priority || 'MEDIA',
        deadline: deadline ? new Date(deadline) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        milestones: milestones?.length > 0 ? {
          create: milestones.map((m: any, i: number) => ({
            title: m.title,
            targetDate: m.targetDate ? new Date(m.targetDate) : null,
            order: i,
          }))
        } : undefined,
      },
      include: { milestones: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
