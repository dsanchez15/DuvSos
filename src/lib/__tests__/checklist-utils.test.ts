// Feature: checklist-improvements, Property 9: Expiration boundary correctness
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { isExpired, daysRemaining } from '@/lib/checklist-utils'

/**
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 *
 * Property 9: Expiration boundary correctness
 * For any checklist with an endDate, isExpired returns true iff the current
 * local calendar date is strictly after the endDate calendar date.
 * When the current date equals the endDate, daysRemaining returns 1.
 */
describe('Property 9: Expiration boundary correctness', () => {
  /** Arbitrary that generates valid dates in a reasonable range. */
  const validDate = fc
    .date({ min: new Date(2000, 0, 1), max: new Date(2099, 11, 31) })
    .filter((d) => !isNaN(d.getTime()))

  /**
   * Helper: strips time from a Date, returning midnight of the same day.
   */
  function stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  /**
   * Helper: adds days to a date (date portion only).
   */
  function addDays(date: Date, days: number): Date {
    const result = stripTime(date)
    result.setDate(result.getDate() + days)
    return result
  }

  it('isExpired returns true iff now (date portion) is strictly after endDate (date portion)', () => {
    fc.assert(
      fc.property(validDate, validDate, (endDate, now) => {
        const endDay = stripTime(endDate)
        const nowDay = stripTime(now)
        const expected = nowDay.getTime() > endDay.getTime()
        expect(isExpired(endDate, now)).toBe(expected)
      }),
      { numRuns: 100 }
    )
  })

  it('isExpired returns false when now equals endDate (same calendar day)', () => {
    fc.assert(
      fc.property(
        validDate,
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 }),
        fc.integer({ min: 0, max: 59 }),
        (endDate, hours, minutes, seconds) => {
          const now = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate(),
            hours,
            minutes,
            seconds
          )
          expect(isExpired(endDate, now)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('isExpired returns false when now is the day before endDate', () => {
    fc.assert(
      fc.property(validDate, (endDate) => {
        const dayBefore = addDays(endDate, -1)
        expect(isExpired(endDate, dayBefore)).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('isExpired returns true when now is the day after endDate', () => {
    fc.assert(
      fc.property(validDate, (endDate) => {
        const dayAfter = addDays(endDate, 1)
        expect(isExpired(endDate, dayAfter)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('daysRemaining returns exactly 1 when now equals endDate', () => {
    fc.assert(
      fc.property(
        validDate,
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 }),
        fc.integer({ min: 0, max: 59 }),
        (endDate, hours, minutes, seconds) => {
          const now = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate(),
            hours,
            minutes,
            seconds
          )
          expect(daysRemaining(endDate, now)).toBe(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('daysRemaining returns a positive number > 1 when now is before endDate', () => {
    fc.assert(
      fc.property(
        validDate,
        fc.integer({ min: 1, max: 365 }),
        (endDate, daysBefore) => {
          const now = addDays(endDate, -daysBefore)
          const remaining = daysRemaining(endDate, now)
          expect(remaining).toBeGreaterThan(1)
          // Should equal daysBefore + 1 (since endDate itself counts as 1)
          expect(remaining).toBe(daysBefore + 1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('time components are irrelevant — same date with different times gives same result', () => {
    fc.assert(
      fc.property(
        validDate,
        validDate,
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 }),
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 }),
        (endDate, baseNow, hours1, minutes1, hours2, minutes2) => {
          const now1 = new Date(
            baseNow.getFullYear(),
            baseNow.getMonth(),
            baseNow.getDate(),
            hours1,
            minutes1,
            0
          )
          const now2 = new Date(
            baseNow.getFullYear(),
            baseNow.getMonth(),
            baseNow.getDate(),
            hours2,
            minutes2,
            59
          )
          // Same calendar day with different times should produce identical results
          expect(isExpired(endDate, now1)).toBe(isExpired(endDate, now2))
          expect(daysRemaining(endDate, now1)).toBe(daysRemaining(endDate, now2))
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: checklist-improvements, Property 5: Subtask counter accuracy
import { getSubtaskProgress, isParentAutoCompleted } from '@/lib/checklist-utils'
import type { ChecklistItem } from '@/types/checklist'

/**
 * Validates: Requirements 3.1, 3.3, 3.5
 *
 * Property 5: Subtask counter accuracy
 * For any Parent_Item in a checklist item list, the displayed counter SHALL equal
 * `{c}/{t}` where `c` is the count of direct children with `completed === true`,
 * and `t` is the total count of direct children. If `t === 0`, no counter SHALL be displayed.
 */
describe('Property 5: Subtask counter accuracy', () => {
  /**
   * Arbitrary: generates a valid ChecklistItem with given overrides.
   */
  const checklistItemArb = (overrides: Partial<ChecklistItem> = {}) =>
    fc.record({
      id: fc.integer({ min: 1, max: 10000 }),
      title: fc.string({ minLength: 1, maxLength: 50 }),
      completed: fc.boolean(),
      position: fc.integer({ min: 0, max: 100 }),
      notes: fc.constant(null),
      priority: fc.constantFrom('low', 'normal', 'high') as fc.Arbitrary<ChecklistItem['priority']>,
      checklistId: fc.constant(1),
      parentId: fc.constant(null as number | null),
      blockedByItemId: fc.constant(null as number | null),
      effortEstimate: fc.constant(null as number | null),
    }).map((item) => ({ ...item, ...overrides }))

  /**
   * Arbitrary: generates a parent item with a set of direct children.
   * Returns { parent, children, items } where items is the full list.
   */
  const parentWithChildrenArb = fc
    .integer({ min: 1, max: 20 })
    .chain((childCount) =>
      fc.record({
        parentId: fc.integer({ min: 1, max: 1000 }),
        childCompletions: fc.array(fc.boolean(), {
          minLength: childCount,
          maxLength: childCount,
        }),
      })
    )
    .map(({ parentId, childCompletions }) => {
      const parent: ChecklistItem = {
        id: parentId,
        title: `Parent ${parentId}`,
        completed: false,
        position: 0,
        priority: 'normal',
        checklistId: 1,
        parentId: null,
        blockedByItemId: null,
        effortEstimate: null,
      }

      const children: ChecklistItem[] = childCompletions.map(
        (completed, idx) => ({
          id: parentId * 1000 + idx + 1,
          title: `Child ${idx}`,
          completed,
          position: idx,
          priority: 'normal' as const,
          checklistId: 1,
          parentId: parentId,
          blockedByItemId: null,
          effortEstimate: null,
        })
      )

      return { parent, children, items: [parent, ...children] }
    })

  /**
   * Arbitrary: generates a parent with zero children.
   */
  const parentWithNoChildrenArb = fc
    .integer({ min: 1, max: 1000 })
    .map((parentId) => {
      const parent: ChecklistItem = {
        id: parentId,
        title: `Parent ${parentId}`,
        completed: false,
        position: 0,
        priority: 'normal',
        checklistId: 1,
        parentId: null,
        blockedByItemId: null,
        effortEstimate: null,
      }
      return { parent, items: [parent] }
    })

  /**
   * Arbitrary: generates a list with multiple parents and children,
   * plus unrelated items (grandchildren or items with different parentIds).
   */
  const complexItemListArb = fc
    .record({
      targetParentId: fc.integer({ min: 1, max: 100 }),
      directChildCount: fc.integer({ min: 1, max: 10 }),
      directChildCompletions: fc.array(fc.boolean(), {
        minLength: 1,
        maxLength: 10,
      }),
      unrelatedItemCount: fc.integer({ min: 0, max: 5 }),
    })
    .map(({ targetParentId, directChildCompletions, unrelatedItemCount }) => {
      const parent: ChecklistItem = {
        id: targetParentId,
        title: `Target Parent`,
        completed: false,
        position: 0,
        priority: 'normal',
        checklistId: 1,
        parentId: null,
        blockedByItemId: null,
        effortEstimate: null,
      }

      const directChildren: ChecklistItem[] = directChildCompletions.map(
        (completed, idx) => ({
          id: targetParentId * 1000 + idx + 1,
          title: `Direct Child ${idx}`,
          completed,
          position: idx,
          priority: 'normal' as const,
          checklistId: 1,
          parentId: targetParentId,
          blockedByItemId: null,
          effortEstimate: null,
        })
      )

      // Unrelated items: different parent or grandchildren
      const otherParentId = targetParentId + 500
      const unrelatedItems: ChecklistItem[] = Array.from(
        { length: unrelatedItemCount },
        (_, idx) => ({
          id: otherParentId * 1000 + idx + 1,
          title: `Unrelated ${idx}`,
          completed: true,
          position: idx,
          priority: 'normal' as const,
          checklistId: 1,
          parentId: otherParentId,
          blockedByItemId: null,
          effortEstimate: null,
        })
      )

      const otherParent: ChecklistItem = {
        id: otherParentId,
        title: `Other Parent`,
        completed: false,
        position: 1,
        priority: 'normal',
        checklistId: 1,
        parentId: null,
        blockedByItemId: null,
        effortEstimate: null,
      }

      const items = [parent, ...directChildren, otherParent, ...unrelatedItems]
      const expectedCompleted = directChildCompletions.filter(Boolean).length
      const expectedTotal = directChildCompletions.length

      return { items, targetParentId, expectedCompleted, expectedTotal }
    })

  it('returns correct completed/total counts for direct children only', () => {
    fc.assert(
      fc.property(parentWithChildrenArb, ({ parent, children, items }) => {
        const result = getSubtaskProgress(items, parent.id)
        const expectedCompleted = children.filter((c) => c.completed).length
        const expectedTotal = children.length

        expect(result.completed).toBe(expectedCompleted)
        expect(result.total).toBe(expectedTotal)
      }),
      { numRuns: 100 }
    )
  })

  it('returns { completed: 0, total: 0 } when parent has no children', () => {
    fc.assert(
      fc.property(parentWithNoChildrenArb, ({ parent, items }) => {
        const result = getSubtaskProgress(items, parent.id)
        expect(result.completed).toBe(0)
        expect(result.total).toBe(0)
      }),
      { numRuns: 100 }
    )
  })

  it('counts only direct children, ignoring items with different parentIds', () => {
    fc.assert(
      fc.property(complexItemListArb, ({ items, targetParentId, expectedCompleted, expectedTotal }) => {
        const result = getSubtaskProgress(items, targetParentId)
        expect(result.completed).toBe(expectedCompleted)
        expect(result.total).toBe(expectedTotal)
      }),
      { numRuns: 100 }
    )
  })

  it('completed count is always <= total count', () => {
    fc.assert(
      fc.property(parentWithChildrenArb, ({ parent, items }) => {
        const result = getSubtaskProgress(items, parent.id)
        expect(result.completed).toBeLessThanOrEqual(result.total)
      }),
      { numRuns: 100 }
    )
  })

  it('total equals the number of items whose parentId matches', () => {
    fc.assert(
      fc.property(parentWithChildrenArb, ({ parent, items }) => {
        const result = getSubtaskProgress(items, parent.id)
        const manualCount = items.filter((i) => i.parentId === parent.id).length
        expect(result.total).toBe(manualCount)
      }),
      { numRuns: 100 }
    )
  })
})

// Feature: checklist-improvements, Property 6: Parent auto-completion derivation

/**
 * Validates: Requirements 4.2, 4.4, 4.5
 *
 * Property 6: Parent auto-completion derivation
 * For any Parent_Item with one or more Child_Items, the Parent_Item's `completed`
 * field SHALL be true if and only if every direct Child_Item has `completed === true`.
 */
describe('Property 6: Parent auto-completion derivation', () => {
  /**
   * Arbitrary: generates a parent with children where all children are completed.
   */
  const allCompletedChildrenArb = fc
    .integer({ min: 1, max: 20 })
    .chain((childCount) => fc.integer({ min: 1, max: 1000 }).map((parentId) => ({ parentId, childCount })))
    .map(({ parentId, childCount }) => {
      const parent: ChecklistItem = {
        id: parentId,
        title: `Parent ${parentId}`,
        completed: false,
        position: 0,
        priority: 'normal',
        checklistId: 1,
        parentId: null,
        blockedByItemId: null,
        effortEstimate: null,
      }

      const children: ChecklistItem[] = Array.from(
        { length: childCount },
        (_, idx) => ({
          id: parentId * 1000 + idx + 1,
          title: `Child ${idx}`,
          completed: true,
          position: idx,
          priority: 'normal' as const,
          checklistId: 1,
          parentId: parentId,
          blockedByItemId: null,
          effortEstimate: null,
        })
      )

      return { parent, children, items: [parent, ...children] }
    })

  /**
   * Arbitrary: generates a parent with at least one incomplete child.
   */
  const someIncompleteChildrenArb = fc
    .record({
      parentId: fc.integer({ min: 1, max: 1000 }),
      childCount: fc.integer({ min: 2, max: 20 }),
      incompleteIndex: fc.integer({ min: 0, max: 19 }),
    })
    .filter(({ childCount, incompleteIndex }) => incompleteIndex < childCount)
    .map(({ parentId, childCount, incompleteIndex }) => {
      const parent: ChecklistItem = {
        id: parentId,
        title: `Parent ${parentId}`,
        completed: false,
        position: 0,
        priority: 'normal',
        checklistId: 1,
        parentId: null,
        blockedByItemId: null,
        effortEstimate: null,
      }

      const children: ChecklistItem[] = Array.from(
        { length: childCount },
        (_, idx) => ({
          id: parentId * 1000 + idx + 1,
          title: `Child ${idx}`,
          completed: idx !== incompleteIndex,
          position: idx,
          priority: 'normal' as const,
          checklistId: 1,
          parentId: parentId,
          blockedByItemId: null,
          effortEstimate: null,
        })
      )

      return { parent, children, items: [parent, ...children] }
    })

  /**
   * Arbitrary: generates a parent with mixed completion states.
   */
  const mixedChildrenArb = fc
    .record({
      parentId: fc.integer({ min: 1, max: 1000 }),
      childCompletions: fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
    })
    .map(({ parentId, childCompletions }) => {
      const parent: ChecklistItem = {
        id: parentId,
        title: `Parent ${parentId}`,
        completed: false,
        position: 0,
        priority: 'normal',
        checklistId: 1,
        parentId: null,
        blockedByItemId: null,
        effortEstimate: null,
      }

      const children: ChecklistItem[] = childCompletions.map(
        (completed, idx) => ({
          id: parentId * 1000 + idx + 1,
          title: `Child ${idx}`,
          completed,
          position: idx,
          priority: 'normal' as const,
          checklistId: 1,
          parentId: parentId,
          blockedByItemId: null,
          effortEstimate: null,
        })
      )

      const allCompleted = childCompletions.every(Boolean)
      return { parent, children, items: [parent, ...children], allCompleted }
    })

  /**
   * Arbitrary: generates a parent with zero children.
   */
  const noChildrenArb = fc
    .integer({ min: 1, max: 1000 })
    .map((parentId) => {
      const parent: ChecklistItem = {
        id: parentId,
        title: `Parent ${parentId}`,
        completed: false,
        position: 0,
        priority: 'normal',
        checklistId: 1,
        parentId: null,
        blockedByItemId: null,
        effortEstimate: null,
      }
      return { parent, items: [parent] }
    })

  it('returns true when all direct children are completed', () => {
    fc.assert(
      fc.property(allCompletedChildrenArb, ({ parent, items }) => {
        expect(isParentAutoCompleted(items, parent.id)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it('returns false when at least one direct child is incomplete', () => {
    fc.assert(
      fc.property(someIncompleteChildrenArb, ({ parent, items }) => {
        expect(isParentAutoCompleted(items, parent.id)).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('returns true iff every direct child has completed === true (biconditional)', () => {
    fc.assert(
      fc.property(mixedChildrenArb, ({ parent, items, allCompleted }) => {
        expect(isParentAutoCompleted(items, parent.id)).toBe(allCompleted)
      }),
      { numRuns: 100 }
    )
  })

  it('returns false when parent has no children', () => {
    fc.assert(
      fc.property(noChildrenArb, ({ parent, items }) => {
        expect(isParentAutoCompleted(items, parent.id)).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('considers only direct children, not grandchildren or unrelated items', () => {
    fc.assert(
      fc.property(
        fc.record({
          parentId: fc.integer({ min: 1, max: 100 }),
          childCompletions: fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        }),
        ({ parentId, childCompletions }) => {
          const parent: ChecklistItem = {
            id: parentId,
            title: `Parent`,
            completed: false,
            position: 0,
            priority: 'normal',
            checklistId: 1,
            parentId: null,
            blockedByItemId: null,
            effortEstimate: null,
          }

          const directChildren: ChecklistItem[] = childCompletions.map(
            (completed, idx) => ({
              id: parentId * 1000 + idx + 1,
              title: `Child ${idx}`,
              completed,
              position: idx,
              priority: 'normal' as const,
              checklistId: 1,
              parentId: parentId,
              blockedByItemId: null,
              effortEstimate: null,
            })
          )

          // Add a grandchild (child of a child) — should NOT affect result
          const grandchild: ChecklistItem = {
            id: 99999,
            title: 'Grandchild',
            completed: false,
            position: 0,
            priority: 'normal',
            checklistId: 1,
            parentId: directChildren[0].id,
            blockedByItemId: null,
            effortEstimate: null,
          }

          const items = [parent, ...directChildren, grandchild]
          const expectedResult = childCompletions.every(Boolean)
          expect(isParentAutoCompleted(items, parentId)).toBe(expectedResult)
        }
      ),
      { numRuns: 100 }
    )
  })
})


// Feature: checklist-improvements, Property 3: Default display shows only parents

/**
 * Validates: Requirements 2.1
 *
 * Property 3: Default display shows only parents
 * For any checklist item list containing both parent and child items, the default
 * rendered output SHALL include only items with null parentId (Parent_Items),
 * and SHALL exclude all items with a non-null parentId.
 *
 * This tests the buildTree filtering logic used in ExpandedItems component.
 * When all parents are collapsed (default state), only top-level items are visible.
 */
describe('Property 3: Default display shows only parents', () => {
  /**
   * Replicates the buildTree logic from ExpandedItems component.
   * When collapsedParents contains all parent IDs, children are hidden.
   */
  function buildTree(
    items: ChecklistItem[],
    collapsedParents: Set<number>,
    parentId: number | null = null,
    depth = 0
  ): Array<{ item: ChecklistItem; depth: number }> {
    const result: Array<{ item: ChecklistItem; depth: number }> = []
    items
      .filter((i) => (i.parentId ?? null) === parentId)
      .forEach((item) => {
        result.push({ item, depth })
        if (!collapsedParents.has(item.id)) {
          result.push(...buildTree(items, collapsedParents, item.id, depth + 1))
        }
      })
    return result
  }

  /**
   * Replicates the default collapsedParents initialization from ExpandedItems.
   * All parents that have children start collapsed.
   */
  function getDefaultCollapsedParents(items: ChecklistItem[]): Set<number> {
    const parents = items
      .filter((i) => !i.parentId || i.parentId === null)
      .filter((parent) => items.some((child) => child.parentId === parent.id))
      .map((p) => p.id)
    return new Set(parents)
  }

  /**
   * Arbitrary: generates a list of items with parent/child relationships.
   * Ensures at least one parent and at least one child.
   */
  const itemListWithHierarchyArb = fc
    .record({
      parentCount: fc.integer({ min: 1, max: 5 }),
      childrenPerParent: fc.array(fc.integer({ min: 0, max: 5 }), {
        minLength: 1,
        maxLength: 5,
      }),
    })
    .filter(({ childrenPerParent }) => childrenPerParent.some((c) => c > 0))
    .map(({ parentCount, childrenPerParent }) => {
      const actualParentCount = Math.min(parentCount, childrenPerParent.length)
      const items: ChecklistItem[] = []
      let nextId = 1

      for (let p = 0; p < actualParentCount; p++) {
        const parentId = nextId++
        items.push({
          id: parentId,
          title: `Parent ${p}`,
          completed: false,
          position: p,
          priority: 'normal',
          checklistId: 1,
          parentId: null,
          blockedByItemId: null,
          effortEstimate: null,
        })

        const childCount = childrenPerParent[p] || 0
        for (let c = 0; c < childCount; c++) {
          items.push({
            id: nextId++,
            title: `Child ${p}-${c}`,
            completed: false,
            position: c,
            priority: 'normal',
            checklistId: 1,
            parentId: parentId,
            blockedByItemId: null,
            effortEstimate: null,
          })
        }
      }

      return items
    })

  /**
   * Arbitrary: generates a mixed list with parents (some with children, some without).
   */
  const mixedParentListArb = fc
    .record({
      parentsWithKids: fc.integer({ min: 1, max: 4 }),
      parentsWithoutKids: fc.integer({ min: 0, max: 3 }),
      childrenPerParent: fc.integer({ min: 1, max: 4 }),
    })
    .map(({ parentsWithKids, parentsWithoutKids, childrenPerParent }) => {
      const items: ChecklistItem[] = []
      let nextId = 1

      // Parents with children
      for (let p = 0; p < parentsWithKids; p++) {
        const parentId = nextId++
        items.push({
          id: parentId,
          title: `ParentWithKids ${p}`,
          completed: false,
          position: p,
          priority: 'normal',
          checklistId: 1,
          parentId: null,
          blockedByItemId: null,
          effortEstimate: null,
        })
        for (let c = 0; c < childrenPerParent; c++) {
          items.push({
            id: nextId++,
            title: `Child ${p}-${c}`,
            completed: false,
            position: c,
            priority: 'normal',
            checklistId: 1,
            parentId: parentId,
            blockedByItemId: null,
            effortEstimate: null,
          })
        }
      }

      // Parents without children
      for (let p = 0; p < parentsWithoutKids; p++) {
        items.push({
          id: nextId++,
          title: `ParentNoKids ${p}`,
          completed: false,
          position: parentsWithKids + p,
          priority: 'normal',
          checklistId: 1,
          parentId: null,
          blockedByItemId: null,
          effortEstimate: null,
        })
      }

      return items
    })

  it('default collapsed state shows only items with null parentId', () => {
    fc.assert(
      fc.property(itemListWithHierarchyArb, (items) => {
        const collapsedParents = getDefaultCollapsedParents(items)
        const visible = buildTree(items, collapsedParents)

        // Every visible item must have null parentId
        for (const { item } of visible) {
          expect(item.parentId ?? null).toBe(null)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('default collapsed state excludes all items with non-null parentId', () => {
    fc.assert(
      fc.property(itemListWithHierarchyArb, (items) => {
        const collapsedParents = getDefaultCollapsedParents(items)
        const visible = buildTree(items, collapsedParents)
        const visibleIds = new Set(visible.map((v) => v.item.id))

        // No child item should be visible
        const childItems = items.filter((i) => i.parentId != null)
        for (const child of childItems) {
          expect(visibleIds.has(child.id)).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('all parent items (null parentId) are present in default view', () => {
    fc.assert(
      fc.property(mixedParentListArb, (items) => {
        const collapsedParents = getDefaultCollapsedParents(items)
        const visible = buildTree(items, collapsedParents)
        const visibleIds = new Set(visible.map((v) => v.item.id))

        // Every parent item should be visible
        const parentItems = items.filter((i) => (i.parentId ?? null) === null)
        for (const parent of parentItems) {
          expect(visibleIds.has(parent.id)).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('visible item count equals the number of top-level items', () => {
    fc.assert(
      fc.property(itemListWithHierarchyArb, (items) => {
        const collapsedParents = getDefaultCollapsedParents(items)
        const visible = buildTree(items, collapsedParents)
        const parentCount = items.filter((i) => (i.parentId ?? null) === null).length

        expect(visible.length).toBe(parentCount)
      }),
      { numRuns: 100 }
    )
  })
})

// Feature: checklist-improvements, Property 4: Chevron visibility matches children presence

/**
 * Validates: Requirements 2.5, 2.6
 *
 * Property 4: Chevron visibility matches children presence
 * For any checklist item list, a Parent_Item SHALL display a chevron toggle icon
 * if and only if there exists at least one item in the list whose parentId equals
 * that Parent_Item's id.
 */
describe('Property 4: Chevron visibility matches children presence', () => {
  /**
   * Replicates the parentsWithChildren derivation from ExpandedItems component.
   * Returns the Set of parent IDs that have at least one child.
   */
  function getParentsWithChildren(items: ChecklistItem[]): Set<number> {
    return new Set(
      items
        .filter((i) => i.parentId != null)
        .map((i) => i.parentId as number)
    )
  }

  /**
   * Arbitrary: generates a list with a mix of parents (some with children, some without).
   */
  const mixedItemListArb = fc
    .record({
      parentsWithKids: fc.integer({ min: 1, max: 5 }),
      parentsWithoutKids: fc.integer({ min: 1, max: 5 }),
      childrenPerParent: fc.integer({ min: 1, max: 4 }),
    })
    .map(({ parentsWithKids, parentsWithoutKids, childrenPerParent }) => {
      const items: ChecklistItem[] = []
      let nextId = 1
      const expectedWithChevron: number[] = []
      const expectedWithoutChevron: number[] = []

      for (let p = 0; p < parentsWithKids; p++) {
        const parentId = nextId++
        items.push({
          id: parentId,
          title: `ParentWithKids ${p}`,
          completed: false,
          position: p,
          priority: 'normal',
          checklistId: 1,
          parentId: null,
          blockedByItemId: null,
          effortEstimate: null,
        })
        expectedWithChevron.push(parentId)

        for (let c = 0; c < childrenPerParent; c++) {
          items.push({
            id: nextId++,
            title: `Child ${p}-${c}`,
            completed: false,
            position: c,
            priority: 'normal',
            checklistId: 1,
            parentId: parentId,
            blockedByItemId: null,
            effortEstimate: null,
          })
        }
      }

      for (let p = 0; p < parentsWithoutKids; p++) {
        const parentId = nextId++
        items.push({
          id: parentId,
          title: `ParentNoKids ${p}`,
          completed: false,
          position: parentsWithKids + p,
          priority: 'normal',
          checklistId: 1,
          parentId: null,
          blockedByItemId: null,
          effortEstimate: null,
        })
        expectedWithoutChevron.push(parentId)
      }

      return { items, expectedWithChevron, expectedWithoutChevron }
    })

  /**
   * Arbitrary: generates a list where all parents have children.
   */
  const allParentsHaveChildrenArb = fc
    .record({
      parentCount: fc.integer({ min: 1, max: 5 }),
      childrenPerParent: fc.integer({ min: 1, max: 5 }),
    })
    .map(({ parentCount, childrenPerParent }) => {
      const items: ChecklistItem[] = []
      let nextId = 1

      for (let p = 0; p < parentCount; p++) {
        const parentId = nextId++
        items.push({
          id: parentId,
          title: `Parent ${p}`,
          completed: false,
          position: p,
          priority: 'normal',
          checklistId: 1,
          parentId: null,
          blockedByItemId: null,
          effortEstimate: null,
        })
        for (let c = 0; c < childrenPerParent; c++) {
          items.push({
            id: nextId++,
            title: `Child ${p}-${c}`,
            completed: false,
            position: c,
            priority: 'normal',
            checklistId: 1,
            parentId: parentId,
            blockedByItemId: null,
            effortEstimate: null,
          })
        }
      }

      return items
    })

  /**
   * Arbitrary: generates a list where no parents have children (flat list).
   */
  const noChildrenListArb = fc
    .integer({ min: 1, max: 10 })
    .map((count) => {
      const items: ChecklistItem[] = []
      for (let i = 0; i < count; i++) {
        items.push({
          id: i + 1,
          title: `Item ${i}`,
          completed: false,
          position: i,
          priority: 'normal',
          checklistId: 1,
          parentId: null,
          blockedByItemId: null,
          effortEstimate: null,
        })
      }
      return items
    })

  it('chevron is shown for parents that have at least one child', () => {
    fc.assert(
      fc.property(mixedItemListArb, ({ items, expectedWithChevron }) => {
        const parentsWithChildren = getParentsWithChildren(items)

        for (const parentId of expectedWithChevron) {
          expect(parentsWithChildren.has(parentId)).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('chevron is NOT shown for parents that have zero children', () => {
    fc.assert(
      fc.property(mixedItemListArb, ({ items, expectedWithoutChevron }) => {
        const parentsWithChildren = getParentsWithChildren(items)

        for (const parentId of expectedWithoutChevron) {
          expect(parentsWithChildren.has(parentId)).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('parentsWithChildren contains exactly the set of IDs referenced by child parentId fields', () => {
    fc.assert(
      fc.property(mixedItemListArb, ({ items }) => {
        const parentsWithChildren = getParentsWithChildren(items)

        // Manually compute expected set
        const expectedSet = new Set<number>()
        for (const item of items) {
          if (item.parentId != null) {
            expectedSet.add(item.parentId)
          }
        }

        // Sets should be identical
        expect(parentsWithChildren.size).toBe(expectedSet.size)
        for (const id of expectedSet) {
          expect(parentsWithChildren.has(id)).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('all parents show chevron when every parent has children', () => {
    fc.assert(
      fc.property(allParentsHaveChildrenArb, (items) => {
        const parentsWithChildren = getParentsWithChildren(items)
        const parentItems = items.filter((i) => (i.parentId ?? null) === null)

        for (const parent of parentItems) {
          expect(parentsWithChildren.has(parent.id)).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('no parents show chevron when list is flat (no children)', () => {
    fc.assert(
      fc.property(noChildrenListArb, (items) => {
        const parentsWithChildren = getParentsWithChildren(items)
        expect(parentsWithChildren.size).toBe(0)
      }),
      { numRuns: 100 }
    )
  })

  it('chevron visibility is biconditional: shown iff hasChildren', () => {
    fc.assert(
      fc.property(mixedItemListArb, ({ items }) => {
        const parentsWithChildren = getParentsWithChildren(items)
        const parentItems = items.filter((i) => (i.parentId ?? null) === null)

        for (const parent of parentItems) {
          const hasChildren = items.some((i) => i.parentId === parent.id)
          expect(parentsWithChildren.has(parent.id)).toBe(hasChildren)
        }
      }),
      { numRuns: 100 }
    )
  })
})


// Feature: checklist-improvements, Property 1: Reorder preserves hierarchy invariants
import { reorderItems, getValidDropTargets, buildOrderedTree } from '@/lib/checklist-utils'

/**
 * Validates: Requirements 1.1, 1.2, 1.3
 *
 * Property 1: Reorder preserves hierarchy invariants
 * For any valid checklist item tree and any valid drag operation, the resulting
 * item list SHALL maintain correct parent-child grouping: every child's parentId
 * references a valid parent in the list, children of the same parent are contiguous
 * in the ordered tree, and a parent move relocates all its children together
 * preserving their internal relative order.
 */
describe('Property 1: Reorder preserves hierarchy invariants', () => {
  /**
   * Arbitrary: generates a valid checklist item tree with parents and children.
   * Returns items with unique IDs and valid parent-child relationships.
   */
  const itemTreeArb = fc
    .record({
      parentCount: fc.integer({ min: 2, max: 5 }),
      childrenPerParent: fc.array(fc.integer({ min: 0, max: 4 }), {
        minLength: 2,
        maxLength: 5,
      }),
    })
    .map(({ parentCount, childrenPerParent }) => {
      const actualParentCount = Math.min(parentCount, childrenPerParent.length)
      const items: ChecklistItem[] = []
      let nextId = 1

      for (let p = 0; p < actualParentCount; p++) {
        const parentId = nextId++
        items.push({
          id: parentId,
          title: `Parent ${p}`,
          completed: false,
          position: p,
          priority: 'normal',
          checklistId: 1,
          parentId: null,
          blockedByItemId: null,
          effortEstimate: null,
        })

        const childCount = childrenPerParent[p]
        for (let c = 0; c < childCount; c++) {
          items.push({
            id: nextId++,
            title: `Child ${p}-${c}`,
            completed: false,
            position: c,
            priority: 'normal',
            checklistId: 1,
            parentId: parentId,
            blockedByItemId: null,
            effortEstimate: null,
          })
        }
      }

      return items
    })

  /**
   * Arbitrary: generates a valid parent drag operation.
   * Picks a random parent and a valid drop index for parent-level moves.
   */
  const parentDragOpArb = itemTreeArb.chain((items) => {
    const parents = items.filter((i) => i.parentId == null)
    if (parents.length < 2) {
      return fc.constant({ items, draggedId: parents[0].id, dropIndex: 0, newParentId: null as number | null })
    }
    return fc
      .record({
        parentIdx: fc.integer({ min: 0, max: parents.length - 1 }),
        dropIdx: fc.integer({ min: 0, max: items.length }),
      })
      .map(({ parentIdx, dropIdx }) => ({
        items,
        draggedId: parents[parentIdx].id,
        dropIndex: dropIdx,
        newParentId: null as number | null,
      }))
  })

  /**
   * Arbitrary: generates a valid child intra-group drag operation.
   * Picks a random child and reorders within its parent group.
   */
  const childIntraGroupDragOpArb = itemTreeArb
    .filter((items) => items.some((i) => i.parentId != null))
    .chain((items) => {
      const children = items.filter((i) => i.parentId != null)
      return fc
        .record({
          childIdx: fc.integer({ min: 0, max: children.length - 1 }),
          dropIdx: fc.integer({ min: 0, max: 10 }),
        })
        .map(({ childIdx, dropIdx }) => {
          const child = children[childIdx]
          return {
            items,
            draggedId: child.id,
            dropIndex: dropIdx,
            newParentId: child.parentId as number | null,
          }
        })
    })

  /**
   * Arbitrary: generates a valid child cross-group drag operation.
   * Picks a random child and moves it to a different parent group.
   */
  const childCrossGroupDragOpArb = itemTreeArb
    .filter((items) => {
      const parents = items.filter((i) => i.parentId == null)
      const children = items.filter((i) => i.parentId != null)
      return parents.length >= 2 && children.length >= 1
    })
    .chain((items) => {
      const parents = items.filter((i) => i.parentId == null)
      const children = items.filter((i) => i.parentId != null)
      return fc
        .record({
          childIdx: fc.integer({ min: 0, max: children.length - 1 }),
          targetParentIdx: fc.integer({ min: 0, max: parents.length - 1 }),
          dropIdx: fc.integer({ min: 0, max: 10 }),
        })
        .filter(({ childIdx, targetParentIdx }) => {
          const child = children[childIdx]
          const targetParent = parents[targetParentIdx]
          return child.parentId !== targetParent.id
        })
        .map(({ childIdx, targetParentIdx, dropIdx }) => ({
          items,
          draggedId: children[childIdx].id,
          dropIndex: dropIdx,
          newParentId: parents[targetParentIdx].id as number | null,
        }))
    })

  it('no items are lost or duplicated after a parent reorder', () => {
    fc.assert(
      fc.property(parentDragOpArb, ({ items, draggedId, dropIndex, newParentId }) => {
        const result = reorderItems(items, draggedId, dropIndex, newParentId)
        const originalIds = items.map((i) => i.id).sort((a, b) => a - b)
        const resultIds = result.items.map((i) => i.id).sort((a, b) => a - b)
        expect(resultIds).toEqual(originalIds)
      }),
      { numRuns: 100 }
    )
  })

  it('no items are lost or duplicated after a child intra-group reorder', () => {
    fc.assert(
      fc.property(childIntraGroupDragOpArb, ({ items, draggedId, dropIndex, newParentId }) => {
        const result = reorderItems(items, draggedId, dropIndex, newParentId)
        const originalIds = items.map((i) => i.id).sort((a, b) => a - b)
        const resultIds = result.items.map((i) => i.id).sort((a, b) => a - b)
        expect(resultIds).toEqual(originalIds)
      }),
      { numRuns: 100 }
    )
  })

  it('no items are lost or duplicated after a child cross-group reorder', () => {
    fc.assert(
      fc.property(childCrossGroupDragOpArb, ({ items, draggedId, dropIndex, newParentId }) => {
        const result = reorderItems(items, draggedId, dropIndex, newParentId)
        const originalIds = items.map((i) => i.id).sort((a, b) => a - b)
        const resultIds = result.items.map((i) => i.id).sort((a, b) => a - b)
        expect(resultIds).toEqual(originalIds)
      }),
      { numRuns: 100 }
    )
  })

  it('every child parentId references a valid parent in the result list', () => {
    fc.assert(
      fc.property(parentDragOpArb, ({ items, draggedId, dropIndex, newParentId }) => {
        const result = reorderItems(items, draggedId, dropIndex, newParentId)
        const parentIds = new Set(
          result.items.filter((i) => i.parentId == null).map((i) => i.id)
        )
        for (const item of result.items) {
          if (item.parentId != null) {
            expect(parentIds.has(item.parentId)).toBe(true)
          }
        }
      }),
      { numRuns: 100 }
    )
  })

  it('children of the same parent are contiguous in the ordered tree', () => {
    fc.assert(
      fc.property(parentDragOpArb, ({ items, draggedId, dropIndex, newParentId }) => {
        const result = reorderItems(items, draggedId, dropIndex, newParentId)
        const orderedTree = buildOrderedTree(result.items)

        // For each parent, find all children in the ordered tree
        const parents = result.items.filter((i) => i.parentId == null)
        for (const parent of parents) {
          const childIndices = orderedTree
            .map((item, idx) => (item.parentId === parent.id ? idx : -1))
            .filter((idx) => idx >= 0)

          if (childIndices.length > 1) {
            // Check contiguity: indices should be consecutive
            for (let i = 1; i < childIndices.length; i++) {
              expect(childIndices[i]).toBe(childIndices[i - 1] + 1)
            }
          }
        }
      }),
      { numRuns: 100 }
    )
  })

  it('parent move relocates all its children together', () => {
    fc.assert(
      fc.property(parentDragOpArb, ({ items, draggedId, dropIndex, newParentId }) => {
        const result = reorderItems(items, draggedId, dropIndex, newParentId)
        const orderedTree = buildOrderedTree(result.items)

        // Find the dragged parent in the result
        const parentIdx = orderedTree.findIndex((i) => i.id === draggedId)
        expect(parentIdx).toBeGreaterThanOrEqual(0)

        // All children of the dragged parent should immediately follow it
        const originalChildren = items
          .filter((i) => i.parentId === draggedId)
          .sort((a, b) => a.position - b.position)

        if (originalChildren.length > 0) {
          const resultChildren = orderedTree.filter((i) => i.parentId === draggedId)
          // Children should be right after the parent
          for (let i = 0; i < resultChildren.length; i++) {
            expect(orderedTree[parentIdx + 1 + i].id).toBe(resultChildren[i].id)
          }
        }
      }),
      { numRuns: 100 }
    )
  })

  it('parent move preserves internal child relative order', () => {
    fc.assert(
      fc.property(parentDragOpArb, ({ items, draggedId, dropIndex, newParentId }) => {
        const result = reorderItems(items, draggedId, dropIndex, newParentId)

        // Get original child order for the dragged parent
        const originalChildOrder = items
          .filter((i) => i.parentId === draggedId)
          .sort((a, b) => a.position - b.position)
          .map((i) => i.id)

        // Get result child order for the dragged parent
        const resultChildOrder = result.items
          .filter((i) => i.parentId === draggedId)
          .sort((a, b) => a.position - b.position)
          .map((i) => i.id)

        // Relative order should be preserved
        expect(resultChildOrder).toEqual(originalChildOrder)
      }),
      { numRuns: 100 }
    )
  })

  it('child cross-group move updates parentId to new parent', () => {
    fc.assert(
      fc.property(childCrossGroupDragOpArb, ({ items, draggedId, dropIndex, newParentId }) => {
        const result = reorderItems(items, draggedId, dropIndex, newParentId)
        const movedItem = result.items.find((i) => i.id === draggedId)
        expect(movedItem).toBeDefined()
        expect(movedItem!.parentId).toBe(newParentId)
      }),
      { numRuns: 100 }
    )
  })

  it('child intra-group move preserves parentId', () => {
    fc.assert(
      fc.property(childIntraGroupDragOpArb, ({ items, draggedId, dropIndex, newParentId }) => {
        const result = reorderItems(items, draggedId, dropIndex, newParentId)
        const movedItem = result.items.find((i) => i.id === draggedId)
        expect(movedItem).toBeDefined()
        expect(movedItem!.parentId).toBe(newParentId)
      }),
      { numRuns: 100 }
    )
  })

  it('children contiguity holds after child cross-group moves', () => {
    fc.assert(
      fc.property(childCrossGroupDragOpArb, ({ items, draggedId, dropIndex, newParentId }) => {
        const result = reorderItems(items, draggedId, dropIndex, newParentId)
        const orderedTree = buildOrderedTree(result.items)

        const parents = result.items.filter((i) => i.parentId == null)
        for (const parent of parents) {
          const childIndices = orderedTree
            .map((item, idx) => (item.parentId === parent.id ? idx : -1))
            .filter((idx) => idx >= 0)

          if (childIndices.length > 1) {
            for (let i = 1; i < childIndices.length; i++) {
              expect(childIndices[i]).toBe(childIndices[i - 1] + 1)
            }
          }
        }
      }),
      { numRuns: 100 }
    )
  })
})

// Feature: checklist-improvements, Property 2: Drop target validation

/**
 * Validates: Requirements 1.7
 *
 * Property 2: Drop target validation
 * For any checklist item tree and any item being dragged, the set of valid drop
 * positions SHALL satisfy: if the dragged item is a Parent_Item, valid positions
 * are only between other top-level items; if the dragged item is a Child_Item,
 * valid positions are between siblings of any parent group.
 */
describe('Property 2: Drop target validation', () => {
  /**
   * Arbitrary: generates a valid checklist item tree with parents and children.
   */
  const itemTreeArb = fc
    .record({
      parentCount: fc.integer({ min: 2, max: 5 }),
      childrenPerParent: fc.array(fc.integer({ min: 0, max: 4 }), {
        minLength: 2,
        maxLength: 5,
      }),
    })
    .map(({ parentCount, childrenPerParent }) => {
      const actualParentCount = Math.min(parentCount, childrenPerParent.length)
      const items: ChecklistItem[] = []
      let nextId = 1

      for (let p = 0; p < actualParentCount; p++) {
        const parentId = nextId++
        items.push({
          id: parentId,
          title: `Parent ${p}`,
          completed: false,
          position: p,
          priority: 'normal',
          checklistId: 1,
          parentId: null,
          blockedByItemId: null,
          effortEstimate: null,
        })

        const childCount = childrenPerParent[p]
        for (let c = 0; c < childCount; c++) {
          items.push({
            id: nextId++,
            title: `Child ${p}-${c}`,
            completed: false,
            position: c,
            priority: 'normal',
            checklistId: 1,
            parentId: parentId,
            blockedByItemId: null,
            effortEstimate: null,
          })
        }
      }

      return items
    })

  /**
   * Arbitrary: picks a parent item from the tree for dragging.
   */
  const parentDragArb = itemTreeArb.chain((items) => {
    const parents = items.filter((i) => i.parentId == null)
    return fc
      .integer({ min: 0, max: parents.length - 1 })
      .map((idx) => ({ items, draggedId: parents[idx].id }))
  })

  /**
   * Arbitrary: picks a child item from the tree for dragging.
   */
  const childDragArb = itemTreeArb
    .filter((items) => items.some((i) => i.parentId != null))
    .chain((items) => {
      const children = items.filter((i) => i.parentId != null)
      return fc
        .integer({ min: 0, max: children.length - 1 })
        .map((idx) => ({ items, draggedId: children[idx].id }))
    })

  it('parent drag targets are only at top-level boundaries (between parents)', () => {
    fc.assert(
      fc.property(parentDragArb, ({ items, draggedId }) => {
        const validTargets = getValidDropTargets(items, draggedId)
        const orderedTree = buildOrderedTree(items)

        // Compute all valid top-level boundary indices
        // These are: index 0, and after each parent's last child (or after parent if no children)
        const topLevelBoundaries = new Set<number>()
        topLevelBoundaries.add(0)

        for (let i = 0; i < orderedTree.length; i++) {
          const current = orderedTree[i]
          if (current.parentId == null) {
            const children = items.filter((item) => item.parentId === current.id)
            if (children.length > 0) {
              const lastChildIdx = orderedTree.findLastIndex(
                (item) => item.parentId === current.id
              )
              topLevelBoundaries.add(lastChildIdx + 1)
            } else {
              topLevelBoundaries.add(i + 1)
            }
          }
        }

        // Every valid target must be a top-level boundary
        for (const target of validTargets) {
          expect(topLevelBoundaries.has(target)).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('child drag targets are only within child groups (between siblings of any parent)', () => {
    fc.assert(
      fc.property(childDragArb, ({ items, draggedId }) => {
        const validTargets = getValidDropTargets(items, draggedId)
        const orderedTree = buildOrderedTree(items)

        // Compute all valid child-level positions
        // These are positions within any parent's child group
        const childGroupPositions = new Set<number>()
        const parents = items.filter((i) => i.parentId == null)

        for (const parent of parents) {
          const children = orderedTree.filter((i) => i.parentId === parent.id)
          if (children.length === 0) {
            // Can drop as first child of this parent
            const parentIdx = orderedTree.findIndex((i) => i.id === parent.id)
            childGroupPositions.add(parentIdx + 1)
          } else {
            // Positions before first child, between children, and after last child
            const firstChildIdx = orderedTree.findIndex(
              (i) => i.parentId === parent.id
            )
            const lastChildIdx = orderedTree.findLastIndex(
              (i) => i.parentId === parent.id
            )

            childGroupPositions.add(firstChildIdx)
            for (let i = firstChildIdx; i <= lastChildIdx; i++) {
              if (orderedTree[i].parentId === parent.id) {
                childGroupPositions.add(i + 1)
              }
            }
          }
        }

        // Every valid target must be within a child group
        for (const target of validTargets) {
          expect(childGroupPositions.has(target)).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('parent drag targets never include positions inside a child group', () => {
    fc.assert(
      fc.property(parentDragArb, ({ items, draggedId }) => {
        const validTargets = getValidDropTargets(items, draggedId)
        const orderedTree = buildOrderedTree(items)

        // Positions that are strictly inside a child group (not at boundaries)
        for (const target of validTargets) {
          // A position is "inside a child group" if the item at that index
          // is a child AND the item before it is also a child of the same parent
          if (target > 0 && target < orderedTree.length) {
            const itemAtTarget = orderedTree[target]
            const itemBefore = orderedTree[target - 1]
            // If both are children of the same parent, this is inside a child group
            if (
              itemAtTarget.parentId != null &&
              itemBefore.parentId === itemAtTarget.parentId
            ) {
              // This should NOT be a valid target for a parent drag
              expect(false).toBe(true)
            }
          }
        }
      }),
      { numRuns: 100 }
    )
  })

  it('child drag targets never include positions between parents (top-level only boundaries)', () => {
    fc.assert(
      fc.property(childDragArb, ({ items, draggedId }) => {
        const validTargets = getValidDropTargets(items, draggedId)
        const orderedTree = buildOrderedTree(items)

        // A "between parents" position is one where both neighbors are parents
        // (or it's position 0 with a parent at index 0, or end with parent as last)
        for (const target of validTargets) {
          if (target === 0) {
            // Position 0 is a top-level boundary only if the first item is a parent
            // For child drags, this should NOT be valid
            if (orderedTree.length > 0 && orderedTree[0].parentId == null) {
              // Check if there's a parent at position 0 with no children before it
              // This is a top-level-only boundary if the item at 0 is a parent
              // and there's no child group context
              // Actually, position 0 could be valid for a child if it's before
              // the first child of the first parent. Let's check more carefully.
              const firstItem = orderedTree[0]
              if (firstItem.parentId == null) {
                // Position 0 is before a parent — not a valid child drop position
                // unless it's also the position of the first child
                const hasChildrenAtStart = orderedTree.length > 1 && orderedTree[1]?.parentId === firstItem.id
                if (!hasChildrenAtStart) {
                  // This is purely a top-level boundary, not valid for child
                  // But getValidDropTargets might include parentIdx+1 for empty parents
                  // which would be position 1, not 0. So position 0 should not be valid.
                  expect(target).not.toBe(0)
                }
              }
            }
          }
        }
      }),
      { numRuns: 100 }
    )
  })

  it('valid targets array contains no duplicates', () => {
    fc.assert(
      fc.property(parentDragArb, ({ items, draggedId }) => {
        const validTargets = getValidDropTargets(items, draggedId)
        const uniqueTargets = [...new Set(validTargets)]
        expect(validTargets.length).toBe(uniqueTargets.length)
      }),
      { numRuns: 100 }
    )
  })

  it('valid targets for child drags contain no duplicates', () => {
    fc.assert(
      fc.property(childDragArb, ({ items, draggedId }) => {
        const validTargets = getValidDropTargets(items, draggedId)
        const uniqueTargets = [...new Set(validTargets)]
        expect(validTargets.length).toBe(uniqueTargets.length)
      }),
      { numRuns: 100 }
    )
  })

  it('valid targets are sorted in ascending order', () => {
    fc.assert(
      fc.property(parentDragArb, ({ items, draggedId }) => {
        const validTargets = getValidDropTargets(items, draggedId)
        for (let i = 1; i < validTargets.length; i++) {
          expect(validTargets[i]).toBeGreaterThan(validTargets[i - 1])
        }
      }),
      { numRuns: 100 }
    )
  })

  it('parent drag always has at least one valid target when multiple parents exist', () => {
    fc.assert(
      fc.property(parentDragArb, ({ items, draggedId }) => {
        const parents = items.filter((i) => i.parentId == null)
        if (parents.length >= 2) {
          const validTargets = getValidDropTargets(items, draggedId)
          expect(validTargets.length).toBeGreaterThan(0)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('child drag always has at least one valid target when parent groups exist', () => {
    fc.assert(
      fc.property(childDragArb, ({ items, draggedId }) => {
        const parents = items.filter((i) => i.parentId == null)
        if (parents.length >= 1) {
          const validTargets = getValidDropTargets(items, draggedId)
          expect(validTargets.length).toBeGreaterThan(0)
        }
      }),
      { numRuns: 100 }
    )
  })
})
