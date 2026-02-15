import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

import { headers } from 'next/headers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { date } = body

    const habit = await prisma.habit.findUnique({
      where: { id },
    })

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    if (habit.userId && habit.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Handle date correctly (local time vs UTC)
    // If date is provided as YYYY-MM-DD, parsing it with new Date() assumes UTC
    // We want to store it as local date (00:00:00 local time)
    let completionDate: Date
    if (date) {
      // Append time to force local time parsing
      completionDate = new Date(`${date}T00:00:00`)
    } else {
      completionDate = new Date()
    }
    completionDate.setHours(0, 0, 0, 0)

    const completion = await prisma.completion.create({
      data: {
        habitId: id,
        date: completionDate,
      },
    })

    return NextResponse.json(completion, { status: 201 })
  } catch (error) {
    console.error('Error creating completion:', error)
    return NextResponse.json(
      { error: 'Failed to create completion' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    // Check ownership via habit
    const habit = await prisma.habit.findUnique({
      where: { id },
    })

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    if (habit.userId && habit.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse date as local time
    const date = new Date(`${dateParam}T00:00:00`)
    date.setHours(0, 0, 0, 0)

    // Create next day date for range query
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    await prisma.completion.deleteMany({
      where: {
        habitId: id,
        date: {
          gte: date,
          lt: nextDay,
        },
      },
    })

    return NextResponse.json({ message: 'Completion deleted successfully' })
  } catch (error) {
    console.error('Error deleting completion:', error)
    return NextResponse.json(
      { error: 'Failed to delete completion' },
      { status: 500 }
    )
  }
}
