import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isValidHexColor } from '@/lib/habit-utils'

import { headers } from 'next/headers'

export async function GET() {
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

    const habits = await prisma.habit.findMany({
      where: {
        userId,
      },
      include: {
        completions: {
          orderBy: {
            date: 'desc',
          },
          take: 30,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(habits)
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, description, color } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (color && !isValidHexColor(color)) {
      return NextResponse.json(
        { error: 'Invalid color format. Must be a valid hex color (#RRGGBB).' },
        { status: 400 }
      )
    }

    const habit = await prisma.habit.create({
      data: {
        title,
        description,
        color: color || '#3b82f6',
        userId,
      },
      include: {
        completions: true,
      },
    })

    return NextResponse.json(habit, { status: 201 })
  } catch (error) {
    console.error('Error creating habit:', error)
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    )
  }
}
