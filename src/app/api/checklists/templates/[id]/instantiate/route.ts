import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

async function getUserId() {
  const h = await headers()
  const id = h.get('x-user-id')
  return id ? parseInt(id, 10) : null
}

function calculateNextDate(pattern: string): Date | null {
  const now = new Date()
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

  if (pattern === 'EVERY_MONDAY') {
    const next = new Date(now)
    next.setDate(now.getDate() + ((1 - now.getDay() + 7) % 7 || 7))
    return next
  }

  if (pattern === 'EVERY_FRIDAY') {
    const next = new Date(now)
    next.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7 || 7))
    return next
  }

  if (pattern === 'FIRST_FRIDAY_OF_MONTH') {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    while (next.getDay() !== 5) {
      next.setDate(next.getDate() + 1)
    }
    return next
  }

  if (pattern === 'FIRST_MONDAY_OF_MONTH') {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    while (next.getDay() !== 1) {
      next.setDate(next.getDate() + 1)
    }
    return next
  }

  // Generic pattern: EVERY_<DAY_NAME>
  const match = pattern.match(/^EVERY_([A-Z]+)$/)
  if (match) {
    const targetDay = dayNames.indexOf(match[1])
    if (targetDay !== -1) {
      const next = new Date(now)
      next.setDate(now.getDate() + ((targetDay - now.getDay() + 7) % 7 || 7))
      return next
    }
  }

  return null
}

interface InstantiateWarning {
  itemTitle: string
  reason: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const templateId = parseInt(id)

    const template = await prisma.checklist.findFirst({
      where: { id: templateId, userId, isTemplate: true },
      include: { items: { orderBy: { position: 'asc' } } },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    let body: any = {}
    try {
      const text = await request.text()
      if (text) body = JSON.parse(text)
    } catch {
      body = {}
    }
    const { title, description, color, startDate, endDate, categoryId } = body || {}

    let computedStartDate: Date | null = null
    if (startDate) {
      computedStartDate = new Date(startDate)
    } else if (template.recurrencePattern) {
      computedStartDate = calculateNextDate(template.recurrencePattern)
    }

    // Create the checklist instance without items first
    const instance = await prisma.checklist.create({
      data: {
        title: title || template.title,
        description: description !== undefined ? description : template.description,
        color: color || template.color,
        isTemplate: false,
        lifecycleState: 'Active',
        startDate: computedStartDate,
        endDate: endDate ? new Date(endDate) : null,
        categoryId: categoryId !== undefined ? (categoryId || null) : template.categoryId,
        userId,
        templateId: template.id,
      },
    })

    const warnings: InstantiateWarning[] = []
    const idMapping = new Map<number, number>()

    if (template.items && template.items.length > 0) {
      // Build a set of all template item IDs for orphan detection
      const templateItemIds = new Set(template.items.map((item: any) => item.id))

      // Separate parent items and child items
      const parentItems = template.items.filter((item: any) => item.parentId === null)
      const childItems = template.items.filter((item: any) => item.parentId !== null)

      // First pass: create parent items (null parentId)
      for (const item of parentItems) {
        const created = await prisma.checklistItem.create({
          data: {
            title: item.title,
            notes: item.notes,
            priority: item.priority,
            position: item.position,
            effortEstimate: item.effortEstimate,
            completed: false,
            parentId: null,
            blockedByItemId: null,
            checklistId: instance.id,
          },
        })
        idMapping.set(item.id, created.id)
      }

      // Second pass: create child items with mapped parentId and blockedByItemId
      for (const item of childItems) {
        let mappedParentId: number | null = null

        if (item.parentId !== null) {
          if (templateItemIds.has(item.parentId) && idMapping.has(item.parentId)) {
            // Valid parent reference — map to new ID
            mappedParentId = idMapping.get(item.parentId)!
          } else {
            // Orphaned parentId: parent doesn't exist in template items
            // Promote to parent (null parentId) and add warning
            mappedParentId = null
            warnings.push({
              itemTitle: item.title,
              reason: `Parent item with original ID ${item.parentId} not found in template; item promoted to parent`,
            })
          }
        }

        // Map blockedByItemId if it references a valid template item
        let mappedBlockedByItemId: number | null = null
        if (item.blockedByItemId !== null) {
          if (idMapping.has(item.blockedByItemId)) {
            mappedBlockedByItemId = idMapping.get(item.blockedByItemId)!
          }
          // If blockedByItemId references an item not yet created (another child),
          // we'll do a post-pass update below
        }

        const created = await prisma.checklistItem.create({
          data: {
            title: item.title,
            notes: item.notes,
            priority: item.priority,
            position: item.position,
            effortEstimate: item.effortEstimate,
            completed: false,
            parentId: mappedParentId,
            blockedByItemId: mappedBlockedByItemId,
            checklistId: instance.id,
          },
        })
        idMapping.set(item.id, created.id)
      }

      // Post-pass: update blockedByItemId references that point to child items
      // (which weren't in the idMapping during the second pass)
      const allItems = [...parentItems, ...childItems]
      for (const item of allItems) {
        if (item.blockedByItemId !== null && idMapping.has(item.blockedByItemId)) {
          const newItemId = idMapping.get(item.id)!
          const mappedBlockerId = idMapping.get(item.blockedByItemId)!

          // Only update if the blocker wasn't correctly set during creation
          // (i.e., if the blocker is a child item that was created after the referencing item)
          const currentItem = await prisma.checklistItem.findUnique({
            where: { id: newItemId },
            select: { blockedByItemId: true },
          })

          if (currentItem && currentItem.blockedByItemId !== mappedBlockerId) {
            await prisma.checklistItem.update({
              where: { id: newItemId },
              data: { blockedByItemId: mappedBlockerId },
            })
          }
        }
      }
    }

    // Fetch the complete instance with items and category
    const result = await prisma.checklist.findUnique({
      where: { id: instance.id },
      include: { items: { orderBy: { position: 'asc' } }, category: true },
    })

    return NextResponse.json(
      { ...result, warnings: warnings.length > 0 ? warnings : undefined },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error instantiating template:', error)
    return NextResponse.json({ error: 'Failed to instantiate template' }, { status: 500 })
  }
}
