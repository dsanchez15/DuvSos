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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { userId }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const entries = await prisma.dailyProgress.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    const summary = {
      gymDays: entries.filter(e => e.gymCompleted).length,
      avgSleep: entries.filter(e => e.sleepHours).reduce((a, e) => a + (e.sleepHours || 0), 0) / (entries.filter(e => e.sleepHours).length || 1),
      totalStudyHours: entries.reduce((a, e) => a + (e.studyHours || 0), 0),
      totalWorkHours: entries.reduce((a, e) => a + (e.workHours || 0), 0),
    }

    return NextResponse.json({ entries, summary })
  } catch (error) {
    console.error('Error fetching daily progress:', error)
    return NextResponse.json({ error: 'Failed to fetch daily progress' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { date, goalId, gymCompleted, sleepHours, studyHours, workHours, notes } = body

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    if (gymCompleted && sleepHours !== undefined && sleepHours < 7) {
      return NextResponse.json({ error: 'Gym requires at least 7 hours of sleep' }, { status: 400 })
    }

    const progress = await prisma.dailyProgress.create({
      data: {
        userId,
        date: new Date(date),
        goalId: goalId || null,
        gymCompleted: gymCompleted || false,
        sleepHours: sleepHours ? parseFloat(sleepHours) : null,
        studyHours: studyHours ? parseFloat(studyHours) : null,
        workHours: workHours ? parseFloat(workHours) : null,
        notes: notes?.trim(),
      },
    })

    if (goalId && (studyHours || workHours)) {
      const hoursToAdd = (studyHours || 0) + (workHours || 0)
      await prisma.goal.update({
        where: { id: goalId },
        data: { totalHoursSpent: { increment: hoursToAdd } },
      })
    }

    return NextResponse.json({ progress }, { status: 201 })
  } catch (error) {
    console.error('Error creating daily progress:', error)
    return NextResponse.json({ error: 'Failed to create daily progress' }, { status: 500 })
  }
}
