import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

async function getUserId() {
  const headersList = await headers()
  const userIdHeader = headersList.get('x-user-id')
  if (!userIdHeader) return null
  return parseInt(userIdHeader, 10)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const goal = await prisma.goal.findFirst({
      where: { id, userId },
      include: {
        milestones: { orderBy: { order: 'asc' } },
        phase: { select: { id: true, number: true, title: true } },
      },
    })

    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error fetching goal:', error)
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.goal.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim()
    if (body.category !== undefined) updateData.category = body.category
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === 'COMPLETED') updateData.completedAt = new Date()
    }
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null
    if (body.estimatedHours !== undefined) updateData.estimatedHours = body.estimatedHours ? parseFloat(body.estimatedHours) : null
    if (body.milestones !== undefined) {
      await prisma.goalMilestone.deleteMany({ where: { goalId: id } })
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...updateData,
        ...(body.milestones?.length > 0 ? {
          milestones: {
            create: body.milestones.map((m: any, i: number) => ({
              title: m.title,
              targetDate: m.targetDate ? new Date(m.targetDate) : null,
              completed: m.completed || false,
              order: m.order ?? i,
            }))
          }
        } : {}),
      },
      include: { milestones: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const existing = await prisma.goal.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

    await prisma.goal.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
