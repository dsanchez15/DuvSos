// Feature: checklist-improvements, Property 7: Parent manual completion rejection
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { NextRequest } from 'next/server'

/**
 * Validates: Requirements 4.7
 *
 * Property 7: Parent manual completion rejection
 * For any Parent_Item that has one or more Child_Items, a PUT request attempting
 * to set `completed: true` directly on that Parent_Item SHALL be rejected with a
 * 400 status code and message "Parent items with children cannot be manually completed".
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
      update: vi.fn(),
    },
    checklistItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import { PUT } from '@/app/api/checklists/[id]/items/[itemId]/route'

const mockedPrisma = prisma as unknown as {
  checklist: {
    findFirst: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  checklistItem: {
    findUnique: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

describe('Property 7: Parent manual completion rejection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createPutRequest(body: Record<string, unknown>): NextRequest {
    return new NextRequest('http://localhost/api/checklists/1/items/42', {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  function createParams(checklistId: number, itemId: number) {
    return {
      params: Promise.resolve({
        id: String(checklistId),
        itemId: String(itemId),
      }),
    }
  }

  it('rejects PUT with completed:true on a parent that has children (400)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),  // checklistId
        fc.integer({ min: 1, max: 1000 }),  // parentItemId
        fc.integer({ min: 1, max: 10 }),    // childCount (1-10)
        async (checklistId, parentItemId, childCount) => {
          vi.clearAllMocks()

          mockedPrisma.checklist.findFirst.mockResolvedValue({
            id: checklistId,
            userId: 1,
            lifecycleState: 'Active',
          })

          mockedPrisma.checklistItem.findUnique.mockResolvedValue({
            id: parentItemId,
            title: `Parent Item ${parentItemId}`,
            completed: false,
            checklistId,
            parentId: null,
            blockedByItemId: null,
          })

          const children = Array.from({ length: childCount }, (_, idx) => ({
            id: parentItemId * 1000 + idx + 1,
            title: `Child ${idx}`,
            completed: false,
            checklistId,
            parentId: parentItemId,
          }))
          mockedPrisma.checklistItem.findMany.mockResolvedValue(children)

          const request = createPutRequest({ completed: true })
          const params = createParams(checklistId, parentItemId)

          const response = await PUT(request, params)
          const data = await response.json()

          expect(response.status).toBe(400)
          expect(data.error).toBe(
            'Parent items with children cannot be manually completed'
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('rejects regardless of how many children the parent has (1 to 10)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // childCount
        async (childCount) => {
          vi.clearAllMocks()

          const checklistId = 1
          const parentItemId = 42

          mockedPrisma.checklist.findFirst.mockResolvedValue({
            id: checklistId,
            userId: 1,
            lifecycleState: 'Active',
          })

          mockedPrisma.checklistItem.findUnique.mockResolvedValue({
            id: parentItemId,
            title: 'Parent',
            completed: false,
            checklistId,
            parentId: null,
            blockedByItemId: null,
          })

          const children = Array.from({ length: childCount }, (_, idx) => ({
            id: 1000 + idx,
            title: `Child ${idx}`,
            completed: idx % 2 === 0,
            checklistId,
            parentId: parentItemId,
          }))
          mockedPrisma.checklistItem.findMany.mockResolvedValue(children)

          const request = createPutRequest({ completed: true })
          const params = createParams(checklistId, parentItemId)

          const response = await PUT(request, params)
          const data = await response.json()

          expect(response.status).toBe(400)
          expect(data.error).toBe(
            'Parent items with children cannot be manually completed'
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('allows completion when parent has zero children (not rejected)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }), // checklistId
        fc.integer({ min: 1, max: 1000 }), // itemId (leaf item)
        async (checklistId, itemId) => {
          vi.clearAllMocks()

          mockedPrisma.checklist.findFirst.mockResolvedValue({
            id: checklistId,
            userId: 1,
            lifecycleState: 'Active',
          })

          mockedPrisma.checklistItem.findUnique.mockResolvedValue({
            id: itemId,
            title: 'Leaf Item',
            completed: false,
            checklistId,
            parentId: null,
            blockedByItemId: null,
          })

          // No children for the parent check, then all items for lifecycle check
          mockedPrisma.checklistItem.findMany
            .mockResolvedValueOnce([]) // children check
            .mockResolvedValueOnce([   // lifecycle: all items in checklist
              {
                id: itemId,
                title: 'Leaf Item',
                completed: true,
                checklistId,
                parentId: null,
              },
            ])

          mockedPrisma.checklistItem.update.mockResolvedValue({
            id: itemId,
            title: 'Leaf Item',
            completed: true,
            checklistId,
            parentId: null,
            blockedByItemId: null,
          })

          mockedPrisma.checklist.update.mockResolvedValue({})

          const request = createPutRequest({ completed: true })
          const params = createParams(checklistId, itemId)

          const response = await PUT(request, params)

          // Should NOT be 400 — completion is allowed for items without children
          expect(response.status).not.toBe(400)
        }
      ),
      { numRuns: 100 }
    )
  })
})
