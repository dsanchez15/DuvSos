import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

async function getUserId() {
  const headersList = await headers()
  const userIdHeader = headersList.get('x-user-id')
  if (!userIdHeader) return null
  return parseInt(userIdHeader, 10)
}

function getStartOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getStartOfMonth(date: Date) {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date()
    const weekStart = getStartOfWeek(today)
    const monthStart = getStartOfMonth(today)

    const gymProgress = await prisma.dailyProgress.findMany({
      where: { userId, gymCompleted: true, date: { gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { date: 'desc' },
      select: { date: true },
    })

    let gymStreak = 0
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    for (let i = 0; i < gymProgress.length; i++) {
      const dateStr = gymProgress[i].date.toISOString().split('T')[0]
      if (i === 0 && dateStr !== todayStr && dateStr !== yesterdayStr) break
      if (i === 0) gymStreak = 1
      else {
        const expected = new Date(gymProgress[i - 1].date)
        expected.setDate(expected.getDate() - 1)
        if (gymProgress[i].date.toISOString().split('T')[0] === expected.toISOString().split('T')[0]) {
          gymStreak++
        } else break
      }
    }

    const weekProgress = await prisma.dailyProgress.findMany({
      where: { userId, date: { gte: weekStart } },
    })

    const monthProgress = await prisma.dailyProgress.findMany({
      where: { userId, date: { gte: monthStart } },
    })

    const [totalGoals, completedGoals] = await Promise.all([
      prisma.goal.count({ where: { userId } }),
      prisma.goal.count({ where: { userId, status: 'COMPLETED' } }),
    ])

    const nextMilestones = await prisma.goalMilestone.findMany({
      where: {
        goal: { userId },
        completed: false,
        targetDate: { gte: today, lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { targetDate: 'asc' },
      take: 5,
      include: { goal: { select: { id: true, title: true } } },
    })

    return NextResponse.json({
      gymStreak,
      hoursThisWeek: weekProgress.reduce((a, e) => a + (e.studyHours || 0) + (e.workHours || 0), 0),
      hoursThisMonth: monthProgress.reduce((a, e) => a + (e.studyHours || 0) + (e.workHours || 0), 0),
      totalGoals,
      completedGoals,
      nextMilestones,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
