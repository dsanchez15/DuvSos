import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

async function getUserId() {
  const h = await headers()
  const id = h.get('x-user-id')
  return id ? parseInt(id, 10) : null
}

function countDescendants(items: { id: number; parentId: number | null }[], parentId: number): number {
  let count = 0
  const children = items.filter(i => i.parentId === parentId)
  for (const child of children) {
    count += 1 + countDescendants(items, child.id)
  }
  return count
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const checklistId = parseInt(id)

    const checklist = await prisma.checklist.findFirst({ where: { id: checklistId, userId } })
    if (!checklist) return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })

    const body = await request.json()
    const { title, notes, priority, parentId, effortEstimate, blockedByItemId } = body
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    let insertPosition: number
    const allItems = await prisma.checklistItem.findMany({
      where: { checklistId },
      orderBy: { position: 'asc' },
      select: { id: true, position: true, parentId: true },
    })

    if (parentId) {
      const parentItem = allItems.find(i => i.id === parentId)
      if (!parentItem) {
        return NextResponse.json({ error: 'Parent item not found' }, { status: 400 })
      }
      const descCount = countDescendants(allItems, parentId)
      insertPosition = parentItem.position + 1 + descCount

      await prisma.checklistItem.updateMany({
        where: { checklistId, position: { gte: insertPosition } },
        data: { position: { increment: 1 } },
      })
    } else {
      const maxPos = allItems.length > 0 ? allItems[allItems.length - 1].position : -1
      insertPosition = maxPos + 1
    }

    const item = await prisma.checklistItem.create({
      data: {
        title: title.trim(),
        notes: notes || null,
        priority: priority || 'normal',
        position: insertPosition,
        checklistId,
        parentId: parentId || null,
        effortEstimate: effortEstimate || null,
        blockedByItemId: blockedByItemId || null,
      },
    })

    // Parent sync: if the new child is incomplete and its parent is completed, uncomplete the parent
    if (parentId && !item.completed) {
      const parentItem = await prisma.checklistItem.findUnique({
        where: { id: parentId },
        select: { completed: true },
      })
      if (parentItem?.completed) {
        await prisma.checklistItem.update({
          where: { id: parentId },
          data: { completed: false },
        })
      }
    }

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
