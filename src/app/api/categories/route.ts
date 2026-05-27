import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

async function getUserId(): Promise<number | null> {
  const headersList = await headers()
  const userIdHeader = headersList.get('x-user-id')
  if (!userIdHeader) return null
  return parseInt(userIdHeader, 10)
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope')

    const where: any = { userId }
    if (scope) {
      where.scopes = { has: scope }
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, color = '#3b82f6', icon = 'folder', description, scopes } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        color,
        icon,
        description,
        scopes: scopes || ['habit', 'checklist', 'todo', 'study'],
        userId,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
