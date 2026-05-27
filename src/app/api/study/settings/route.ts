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

    const settings = await prisma.studySettings.findUnique({
      where: { userId },
    })

    if (!settings) {
      const defaults = await prisma.studySettings.create({
        data: { userId, showStudySection: true, maxQuestionsPerReview: 20 },
      })
      return NextResponse.json(defaults)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching study settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const headersList = await headers()
    const userIdHeader = headersList.get('x-user-id')
    if (!userIdHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = parseInt(userIdHeader, 10)
    const body = await request.json()

    const settings = await prisma.studySettings.upsert({
      where: { userId },
      create: { userId, ...body },
      update: body,
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating study settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
