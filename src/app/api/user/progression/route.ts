import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

async function getUserId(): Promise<number | null> {
  const headersList = await headers()
  const userIdHeader = headersList.get('x-user-id')
  if (!userIdHeader) return null
  return parseInt(userIdHeader, 10)
}

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const progression = await prisma.userProgression.findUnique({
      where: { userId },
    })

    if (!progression) {
      return NextResponse.json({ totalXP: 0, currentLevel: 1 })
    }

    return NextResponse.json(progression)
  } catch (error) {
    console.error('Error fetching progression:', error)
    return NextResponse.json({ error: 'Failed to fetch progression' }, { status: 500 })
  }
}
