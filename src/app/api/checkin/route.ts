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

    const checkins = await prisma.weeklyCheckIn.findMany({
      where: { userId },
      orderBy: { weekStartDate: 'desc' },
    })

    return NextResponse.json({ checkins })
  } catch (error) {
    console.error('Error fetching check-ins:', error)
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { weekStartDate, fatigueLevel, completedHours, deviations, adjustmentNotes } = body

    if (!weekStartDate) {
      return NextResponse.json({ error: 'weekStartDate is required' }, { status: 400 })
    }

    if (fatigueLevel !== undefined && (fatigueLevel < 1 || fatigueLevel > 5)) {
      return NextResponse.json({ error: 'fatigueLevel must be between 1 and 5' }, { status: 400 })
    }

    const existing = await prisma.weeklyCheckIn.findFirst({
      where: { userId, weekStartDate: new Date(weekStartDate) },
    })

    if (existing) {
      return NextResponse.json({ error: 'Check-in already exists for this week' }, { status: 400 })
    }

    const checkin = await prisma.weeklyCheckIn.create({
      data: {
        userId,
        weekStartDate: new Date(weekStartDate),
        fatigueLevel: fatigueLevel ?? 3,
        completedHours: completedHours ? parseFloat(completedHours) : null,
        deviations: deviations?.trim(),
        adjustmentNotes: adjustmentNotes?.trim(),
      },
    })

    return NextResponse.json({ checkin }, { status: 201 })
  } catch (error) {
    console.error('Error creating check-in:', error)
    return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 })
  }
}
