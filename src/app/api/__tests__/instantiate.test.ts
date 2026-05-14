// Feature: checklist-improvements, Property 10: Template instantiation preserves structure
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

/**
 * Validates: Requirements 7.1, 7.2, 7.3, 7.5
 *
 * Property 10: Template instantiation preserves structure
 * For any template with items containing parentId and blockedByItemId references,
 * instantiation SHALL produce a new item set where:
 * (a) the parent-child hierarchy is isomorphic to the original (same tree shape)
 * (b) each item's position equals its original position
 * (c) blockedByItemId references point to the correct newly-created items via consistent ID mapping
 */

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('1'),
  }),
}))

// Mock @/lib/db
vi.mock('@/lib/db', () => ({
  prisma: {
    checklist: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    checklistItem: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import { POST } from '@/app/api/checklists/templates/[id]/instantiate/route'
import { NextRequest } from 'next/server'

interface TemplateItem {
  id: number
  title: string
  notes: string | null
  priority: string
  position: number
  effortEstimate: number | null
  completed: boolean
  parentId: number | null
  blockedByItemId: number | null
  checklistId: number
}

describe('Property 10: Template instantiation preserves structure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Arbitrary: generates a valid template item set with parent/child relationships
   * and blockedByItemId references. Ensures:
   * - Parents have null parentId
   * - Children reference valid parent IDs
   * - blockedByItemId references valid item IDs within the set
   */
  const templateItemSetArb = fc
    .record({
      parentCount: fc.integer({ min: 1, max: 5 }),
      childrenPerParent: fc.array(fc.integer({ min: 0, max: 4 }), {
        minLength: 1,
        maxLength: 5,
      }),
    })
    .chain(({ parentCount, childrenPerParent }) => {
      const actualChildrenPerParent = childrenPerParent.slice(0, parentCount)
      while (actualChildrenPerParent.length < parentCount) {
        actualChildrenPerParent.push(0)
      }

      const totalItems =
        parentCount + actualChildrenPerParent.reduce((a, b) => a + b, 0)

      return fc
        .array(fc.boolean(), {
          minLength: totalItems,
          maxLength: totalItems,
        })
        .map((hasBlocker) => ({
          parentCount,
          childrenPerParent: actualChildrenPerParent,
          hasBlocker,
        }))
    })
    .map(({ parentCount, childrenPerParent, hasBlocker }) => {
      const items: TemplateItem[] = []
      let nextId = 100

      // Create parent items
      const parentIds: number[] = []
      for (let i = 0; i < parentCount; i++) {
        const id = nextId++
        parentIds.push(id)
        items.push({
          id,
          title: `Parent ${i}`,
          notes: null,
          priority: 'normal',
          position: i,
          effortEstimate: null,
          completed: false,
          parentId: null,
          blockedByItemId: null,
          checklistId: 1,
        })
      }

      // Create child items
      let childPosition = 0
      for (let pi = 0; pi < parentCount; pi++) {
        const childCount = childrenPerParent[pi]
        for (let ci = 0; ci < childCount; ci++) {
          const id = nextId++
          items.push({
            id,
            title: `Child ${pi}-${ci}`,
            notes: null,
            priority: 'normal',
            position: childPosition++,
            effortEstimate: null,
            completed: false,
            parentId: parentIds[pi],
            blockedByItemId: null,
            checklistId: 1,
          })
        }
      }

      // Assign blockedByItemId references (only to items that exist in the set)
      const allIds = items.map((item) => item.id)
      for (let i = 0; i < items.length; i++) {
        if (hasBlocker[i] && allIds.length > 1) {
          const candidates = allIds.filter((id) => id !== items[i].id)
          if (candidates.length > 0) {
            const blockerIdx = i % candidates.length
            items[i].blockedByItemId = candidates[blockerIdx]
          }
        }
      }

      return items
    })

  /**
   * Helper: creates a mock NextRequest for the instantiate endpoint.
   */
  function createMockRequest(): NextRequest {
    return new NextRequest(
      'http://localhost:3000/api/checklists/templates/1/instantiate',
      {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Instance' }),
      }
    )
  }

  /**
   * Helper: sets up prisma mocks for a given template item set.
   * Returns a tracker object that accumulates created items during route execution.
   */
  function setupMocks(templateItems: TemplateItem[]) {
    const instanceId = 999
    let newItemIdCounter = 5000

    // Track created items for verification — populated during route execution
    const createdItems: Array<{
      originalId: number
      newId: number
      parentId: number | null
      blockedByItemId: number | null
      position: number
      title: string
    }> = []

    // ID mapping built during creation — populated during route execution
    const idMapping = new Map<number, number>()

    // Mock findFirst: return the template with items
    ;(prisma.checklist.findFirst as any).mockResolvedValue({
      id: 1,
      title: 'Test Template',
      description: null,
      color: '#000000',
      isTemplate: true,
      recurrencePattern: null,
      categoryId: null,
      items: templateItems,
    })

    // Mock checklist.create: return the new instance
    ;(prisma.checklist.create as any).mockResolvedValue({
      id: instanceId,
      title: 'Test Instance',
      description: null,
      color: '#000000',
      isTemplate: false,
      lifecycleState: 'Active',
      startDate: null,
      endDate: null,
      categoryId: null,
      userId: 1,
      templateId: 1,
    })

    // Mock checklistItem.create: return items with new sequential IDs
    ;(prisma.checklistItem.create as any).mockImplementation(
      ({ data }: { data: any }) => {
        const newId = newItemIdCounter++
        const originalItem = templateItems.find((i) => i.title === data.title)
        if (originalItem) {
          idMapping.set(originalItem.id, newId)
        }

        createdItems.push({
          originalId: originalItem?.id ?? -1,
          newId,
          parentId: data.parentId,
          blockedByItemId: data.blockedByItemId,
          position: data.position,
          title: data.title,
        })

        return Promise.resolve({
          id: newId,
          title: data.title,
          notes: data.notes,
          priority: data.priority,
          position: data.position,
          effortEstimate: data.effortEstimate,
          completed: data.completed,
          parentId: data.parentId,
          blockedByItemId: data.blockedByItemId,
          checklistId: data.checklistId,
        })
      }
    )

    // Mock checklistItem.findUnique: return the item with its current blockedByItemId
    ;(prisma.checklistItem.findUnique as any).mockImplementation(
      ({ where }: { where: { id: number } }) => {
        const created = createdItems.find((i) => i.newId === where.id)
        if (created) {
          return Promise.resolve({
            id: created.newId,
            blockedByItemId: created.blockedByItemId,
          })
        }
        return Promise.resolve(null)
      }
    )

    // Mock checklistItem.update: update the blockedByItemId in our tracker
    ;(prisma.checklistItem.update as any).mockImplementation(
      ({ where, data }: { where: { id: number }; data: any }) => {
        const created = createdItems.find((i) => i.newId === where.id)
        if (created && data.blockedByItemId !== undefined) {
          created.blockedByItemId = data.blockedByItemId
        }
        return Promise.resolve({
          id: where.id,
          ...data,
        })
      }
    )

    // Mock checklist.findUnique: return the final result with all items
    ;(prisma.checklist.findUnique as any).mockImplementation(() => {
      return Promise.resolve({
        id: instanceId,
        title: 'Test Instance',
        description: null,
        color: '#000000',
        isTemplate: false,
        lifecycleState: 'Active',
        startDate: null,
        endDate: null,
        categoryId: null,
        userId: 1,
        templateId: 1,
        category: null,
        items: createdItems.map((c) => ({
          id: c.newId,
          title: c.title,
          position: c.position,
          parentId: c.parentId,
          blockedByItemId: c.blockedByItemId,
          completed: false,
          priority: 'normal',
          checklistId: instanceId,
          notes: null,
          effortEstimate: null,
        })),
      })
    })

    return { instanceId, createdItems, idMapping }
  }

  it('instantiation produces isomorphic parent-child hierarchy (same tree shape)', async () => {
    await fc.assert(
      fc.asyncProperty(templateItemSetArb, async (templateItems) => {
        vi.clearAllMocks()
        const { createdItems, idMapping } = setupMocks(templateItems)

        const request = createMockRequest()
        const response = await POST(request, {
          params: Promise.resolve({ id: '1' }),
        })

        expect(response.status).toBe(201)

        // Build the original tree structure
        const originalParents = templateItems.filter((i) => i.parentId === null)
        const originalChildren = templateItems.filter(
          (i) => i.parentId !== null
        )

        // Build the new tree structure from created items
        const newParents = createdItems.filter((i) => i.parentId === null)
        const newChildren = createdItems.filter((i) => i.parentId !== null)

        // (a) Same number of parents and children
        expect(newParents.length).toBe(originalParents.length)
        expect(newChildren.length).toBe(originalChildren.length)

        // (a) For each original parent, the number of children is preserved
        for (const origParent of originalParents) {
          const origChildCount = originalChildren.filter(
            (c) => c.parentId === origParent.id
          ).length
          const newParentId = idMapping.get(origParent.id)
          expect(newParentId).toBeDefined()

          const newChildCount = newChildren.filter(
            (c) => c.parentId === newParentId
          ).length
          expect(newChildCount).toBe(origChildCount)
        }

        // (a) Every child's parentId maps to a valid new parent
        for (const newChild of newChildren) {
          const isValidParent = newParents.some(
            (p) => p.newId === newChild.parentId
          )
          expect(isValidParent).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('each item position equals its original position', async () => {
    await fc.assert(
      fc.asyncProperty(templateItemSetArb, async (templateItems) => {
        vi.clearAllMocks()
        const { createdItems, idMapping } = setupMocks(templateItems)

        const request = createMockRequest()
        const response = await POST(request, {
          params: Promise.resolve({ id: '1' }),
        })

        expect(response.status).toBe(201)

        // (b) Each created item's position matches its original template item's position
        for (const templateItem of templateItems) {
          const newId = idMapping.get(templateItem.id)
          expect(newId).toBeDefined()

          const createdItem = createdItems.find((c) => c.newId === newId)
          expect(createdItem).toBeDefined()
          expect(createdItem!.position).toBe(templateItem.position)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('blockedByItemId references are correctly mapped via consistent ID mapping', async () => {
    await fc.assert(
      fc.asyncProperty(templateItemSetArb, async (templateItems) => {
        vi.clearAllMocks()
        const { createdItems, idMapping } = setupMocks(templateItems)

        const request = createMockRequest()
        const response = await POST(request, {
          params: Promise.resolve({ id: '1' }),
        })

        expect(response.status).toBe(201)

        // (c) For each template item with a blockedByItemId, the corresponding
        // new item should have blockedByItemId mapped to the new ID of the blocker
        for (const templateItem of templateItems) {
          if (templateItem.blockedByItemId !== null) {
            const newItemId = idMapping.get(templateItem.id)
            expect(newItemId).toBeDefined()

            const createdItem = createdItems.find(
              (c) => c.newId === newItemId
            )
            expect(createdItem).toBeDefined()

            const expectedBlockerId = idMapping.get(
              templateItem.blockedByItemId
            )
            expect(expectedBlockerId).toBeDefined()

            // After the post-pass update, blockedByItemId should be correctly mapped
            expect(createdItem!.blockedByItemId).toBe(expectedBlockerId)
          }
        }
      }),
      { numRuns: 100 }
    )
  })

  it('items without blockedByItemId remain with null blockedByItemId after instantiation', async () => {
    await fc.assert(
      fc.asyncProperty(templateItemSetArb, async (templateItems) => {
        vi.clearAllMocks()
        const { createdItems, idMapping } = setupMocks(templateItems)

        const request = createMockRequest()
        const response = await POST(request, {
          params: Promise.resolve({ id: '1' }),
        })

        expect(response.status).toBe(201)

        // Items without blockers should remain null
        for (const templateItem of templateItems) {
          if (templateItem.blockedByItemId === null) {
            const newItemId = idMapping.get(templateItem.id)
            expect(newItemId).toBeDefined()

            const createdItem = createdItems.find(
              (c) => c.newId === newItemId
            )
            expect(createdItem).toBeDefined()
            expect(createdItem!.blockedByItemId).toBe(null)
          }
        }
      }),
      { numRuns: 100 }
    )
  })
})
