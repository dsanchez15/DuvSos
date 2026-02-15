import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

import { headers } from 'next/headers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const headersList = await headers()
    const userIdHeader = headersList.get('x-user-id')

    if (!userIdHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Middleware guarantees this is a valid number
    const userId = parseInt(userIdHeader, 10)

    const { id: idStr } = await params
    const id = parseInt(idStr, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid habit ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, description, color } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Check ownership
    const existingHabit = await prisma.habit.findUnique({
      where: { id },
    })

    if (!existingHabit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    if (existingHabit.userId && existingHabit.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const habit = await prisma.habit.update({
      where: { id },
      data: {
        title,
        description,
        color,
      },
      include: {
        completions: true,
      },
    })

    return NextResponse.json(habit)
  } catch (error) {
    console.error('Error updating habit:', error)
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const headersList = await headers()
    const userIdHeader = headersList.get('x-user-id')

    if (!userIdHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Middleware guarantees this is a valid number
    const userId = parseInt(userIdHeader, 10)

    const { id: idStr } = await params
    const id = parseInt(idStr, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid habit ID' },
        { status: 400 }
      )
    }

    // Check ownership
    const existingHabit = await prisma.habit.findUnique({
      where: { id },
    })

    if (!existingHabit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    if (existingHabit.userId && existingHabit.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.habit.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Habit deleted successfully' })
  } catch (error) {
    console.error('Error deleting habit:', error)
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    )
  }
}
