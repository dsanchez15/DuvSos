import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

async function getUserId() {
  const headersList = await headers()
  const userIdHeader = headersList.get('x-user-id')
  if (!userIdHeader) return null
  return parseInt(userIdHeader, 10)
}

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const phases = await prisma.phase.findMany({
      where: { userId },
      include: { goals: { select: { id: true } } },
      orderBy: { number: 'asc' },
    })

    const phasesWithCount = phases.map(p => ({
      ...p,
      _count: { goals: p.goals.length },
      goals: undefined,
    }))

    return NextResponse.json({ phases: phasesWithCount })
  } catch (error) {
    console.error('Error fetching phases:', error)
    return NextResponse.json({ error: 'Failed to fetch phases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { number, title, description, startDate, endDate } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!number || typeof number !== 'number') {
      return NextResponse.json({ error: 'Valid phase number is required' }, { status: 400 })
    }

    const existing = await prisma.phase.findFirst({ where: { userId, number } })
    if (existing) {
      return NextResponse.json({ error: 'Phase number already exists' }, { status: 400 })
    }

    const phase = await prisma.phase.create({
      data: {
        userId,
        number,
        title: title.trim(),
        description: description?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json({ phase }, { status: 201 })
  } catch (error) {
    console.error('Error creating phase:', error)
    return NextResponse.json({ error: 'Failed to create phase' }, { status: 500 })
  }
}