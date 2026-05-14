import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

async function getUserId() {
  const h = await headers()
  const id = h.get('x-user-id')
  return id ? parseInt(id, 10) : null
}

type Params = { params: Promise<{ id: string; itemId: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, itemId } = await params
    const checklistId = parseInt(id)
    const checklist = await prisma.checklist.findFirst({ where: { id: checklistId, userId } })
    if (!checklist) return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
    if (checklist.lifecycleState === 'Archived') {
      return NextResponse.json({ error: 'Cannot modify archived checklist' }, { status: 400 })
    }

    const body = await request.json()
    const updateData: any = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.position !== undefined) updateData.position = body.position
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.parentId !== undefined) updateData.parentId = body.parentId || null
    if (body.blockedByItemId !== undefined) updateData.blockedByItemId = body.blockedByItemId || null
    if (body.effortEstimate !== undefined) updateData.effortEstimate = body.effortEstimate || null

    if (body.completed !== undefined) {
      const currentItem = await prisma.checklistItem.findUnique({
        where: { id: parseInt(itemId) },
      })

      // Reject manual completion on parent items that have children
      if (body.completed) {
        const children = await prisma.checklistItem.findMany({
          where: { checklistId, parentId: parseInt(itemId) },
        })
        if (children.length > 0) {
          return NextResponse.json(
            { error: 'Parent items with children cannot be manually completed' },
            { status: 400 }
          )
        }
      }

      // Dependency blocking logic
      if (body.completed) {
        if (currentItem?.blockedByItemId) {
          const blocker = await prisma.checklistItem.findUnique({
            where: { id: currentItem.blockedByItemId },
          })
          if (!blocker?.completed) {
            return NextResponse.json(
              { error: 'This item is blocked by another incomplete item' },
              { status: 400 }
            )
          }
        }
      }
      updateData.completed = body.completed
    }

    const item = await prisma.checklistItem.update({
      where: { id: parseInt(itemId) },
      data: updateData,
    })

    // Parent auto-completion logic
    if (body.completed !== undefined && item.parentId) {
      if (body.completed) {
        // Child was completed: check if all siblings are now completed → auto-complete parent
        const siblings = await prisma.checklistItem.findMany({
          where: { checklistId, parentId: item.parentId },
        })
        const allSiblingsCompleted = siblings.every((s: any) => s.completed)
        if (allSiblingsCompleted) {
          await prisma.checklistItem.update({
            where: { id: item.parentId },
            data: { completed: true },
          })
        }
      } else {
        // Child was unchecked: if parent is completed → set parent.completed = false
        const parent = await prisma.checklistItem.findUnique({
          where: { id: item.parentId },
        })
        if (parent?.completed) {
          await prisma.checklistItem.update({
            where: { id: item.parentId },
            data: { completed: false },
          })
        }
      }
    }

    // Lifecycle auto-complete logic: check if all items are done
    if (body.completed !== undefined) {
      const allItems = await prisma.checklistItem.findMany({
        where: { checklistId },
      })
      const allCompleted = allItems.length > 0 && allItems.every((i: any) => i.completed)
      if (allCompleted && checklist.lifecycleState === 'Active') {
        await prisma.checklist.update({
          where: { id: checklistId },
          data: { lifecycleState: 'Completed', completedAt: new Date() },
        })
      }
      // If un-completing an item in a completed checklist, revert to Active
      if (!body.completed && checklist.lifecycleState === 'Completed') {
        await prisma.checklist.update({
          where: { id: checklistId },
          data: { lifecycleState: 'Active', completedAt: null },
        })
      }
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, itemId } = await params
    const checklistId = parseInt(id)
    const checklist = await prisma.checklist.findFirst({ where: { id: checklistId, userId } })
    if (!checklist) return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })

    // Fetch the item before deletion to check if it has a parent
    const itemToDelete = await prisma.checklistItem.findUnique({
      where: { id: parseInt(itemId) },
    })

    await prisma.checklistItem.delete({ where: { id: parseInt(itemId) } })

    // Parent sync on delete: if the deleted item had a parentId,
    // check if all remaining siblings are completed → auto-complete parent
    if (itemToDelete?.parentId) {
      const remainingSiblings = await prisma.checklistItem.findMany({
        where: { checklistId, parentId: itemToDelete.parentId },
      })
      if (remainingSiblings.length > 0 && remainingSiblings.every((s: any) => s.completed)) {
        await prisma.checklistItem.update({
          where: { id: itemToDelete.parentId },
          data: { completed: true },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
