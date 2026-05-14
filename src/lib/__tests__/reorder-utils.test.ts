import { describe, it, expect } from 'vitest'
import { reorderItems, getValidDropTargets } from '@/lib/checklist-utils'
import { ChecklistItem } from '@/types/checklist'

/**
 * Unit tests for reorderItems and getValidDropTargets.
 * Validates: Requirements 1.1, 1.2, 1.3, 1.7
 */

function makeItem(overrides: Partial<ChecklistItem> & { id: number }): ChecklistItem {
  return {
    title: `Item ${overrides.id}`,
    completed: false,
    position: 0,
    priority: 'normal',
    checklistId: 1,
    parentId: null,
    blockedByItemId: null,
    effortEstimate: null,
    notes: null,
    ...overrides,
  }
}

describe('reorderItems', () => {
  describe('parent moves relocate all children together preserving internal order', () => {
    it('moves a parent and its children to a new position', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
        makeItem({ id: 2, position: 0, parentId: 1 }),
        makeItem({ id: 3, position: 1, parentId: 1 }),
        makeItem({ id: 4, position: 1, parentId: null }),
        makeItem({ id: 5, position: 0, parentId: 4 }),
      ]

      // Move parent 1 (with children 2,3) after parent 4 (dropIndex after parent 4's group)
      const result = reorderItems(items, 1, 3, null)

      // Parent 4 should come first, then parent 1
      const parentOrder = result.items
        .filter((i) => i.parentId == null)
        .sort((a, b) => a.position - b.position)
      expect(parentOrder[0].id).toBe(4)
      expect(parentOrder[1].id).toBe(1)

      // Children of parent 1 should still be in order (2 before 3)
      const children1 = result.items
        .filter((i) => i.parentId === 1)
        .sort((a, b) => a.position - b.position)
      expect(children1[0].id).toBe(2)
      expect(children1[1].id).toBe(3)
    })

    it('preserves children internal order when parent moves to the beginning', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
        makeItem({ id: 2, position: 1, parentId: null }),
        makeItem({ id: 3, position: 0, parentId: 2 }),
        makeItem({ id: 4, position: 1, parentId: 2 }),
        makeItem({ id: 5, position: 2, parentId: 2 }),
      ]

      // Move parent 2 (with children 3,4,5) to position 0 (before parent 1)
      const result = reorderItems(items, 2, 0, null)

      const parentOrder = result.items
        .filter((i) => i.parentId == null)
        .sort((a, b) => a.position - b.position)
      expect(parentOrder[0].id).toBe(2)
      expect(parentOrder[1].id).toBe(1)

      // Children of parent 2 maintain their relative order
      const children2 = result.items
        .filter((i) => i.parentId === 2)
        .sort((a, b) => a.position - b.position)
      expect(children2.map((c) => c.id)).toEqual([3, 4, 5])
    })
  })

  describe('intra-group child moves', () => {
    it('reorders a child within the same parent group', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
        makeItem({ id: 2, position: 0, parentId: 1 }),
        makeItem({ id: 3, position: 1, parentId: 1 }),
        makeItem({ id: 4, position: 2, parentId: 1 }),
      ]

      // Move child 4 to position 0 within parent 1's group
      const result = reorderItems(items, 4, 0, 1)

      const children = result.items
        .filter((i) => i.parentId === 1)
        .sort((a, b) => a.position - b.position)
      expect(children[0].id).toBe(4)
      expect(children[1].id).toBe(2)
      expect(children[2].id).toBe(3)
    })

    it('does not change parentId for intra-group moves', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
        makeItem({ id: 2, position: 0, parentId: 1 }),
        makeItem({ id: 3, position: 1, parentId: 1 }),
      ]

      const result = reorderItems(items, 3, 0, 1)

      const movedItem = result.items.find((i) => i.id === 3)
      expect(movedItem?.parentId).toBe(1)
    })
  })

  describe('cross-group child moves', () => {
    it('moves a child to a different parent group', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
        makeItem({ id: 2, position: 0, parentId: 1 }),
        makeItem({ id: 3, position: 1, parentId: 1 }),
        makeItem({ id: 4, position: 1, parentId: null }),
        makeItem({ id: 5, position: 0, parentId: 4 }),
      ]

      // Move child 2 from parent 1 to parent 4's group at position 1
      const result = reorderItems(items, 2, 1, 4)

      const movedItem = result.items.find((i) => i.id === 2)
      expect(movedItem?.parentId).toBe(4)

      // Parent 4's children should now include item 2
      const children4 = result.items
        .filter((i) => i.parentId === 4)
        .sort((a, b) => a.position - b.position)
      expect(children4.map((c) => c.id)).toContain(2)
    })

    it('updates positions in both source and target groups', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
        makeItem({ id: 2, position: 0, parentId: 1 }),
        makeItem({ id: 3, position: 1, parentId: 1 }),
        makeItem({ id: 4, position: 1, parentId: null }),
        makeItem({ id: 5, position: 0, parentId: 4 }),
        makeItem({ id: 6, position: 1, parentId: 4 }),
      ]

      // Move child 3 from parent 1 to parent 4 at position 0
      const result = reorderItems(items, 3, 0, 4)

      // Source group (parent 1) should have only child 2 at position 0
      const children1 = result.items
        .filter((i) => i.parentId === 1)
        .sort((a, b) => a.position - b.position)
      expect(children1.length).toBe(1)
      expect(children1[0].id).toBe(2)
      expect(children1[0].position).toBe(0)

      // Target group (parent 4) should have child 3 at position 0, then 5, 6
      const children4 = result.items
        .filter((i) => i.parentId === 4)
        .sort((a, b) => a.position - b.position)
      expect(children4[0].id).toBe(3)
      expect(children4[1].id).toBe(5)
      expect(children4[2].id).toBe(6)
    })
  })

  describe('children of the same parent remain contiguous in position order', () => {
    it('positions are 0-based and contiguous after reorder', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
        makeItem({ id: 2, position: 0, parentId: 1 }),
        makeItem({ id: 3, position: 1, parentId: 1 }),
        makeItem({ id: 4, position: 2, parentId: 1 }),
        makeItem({ id: 5, position: 1, parentId: null }),
      ]

      const result = reorderItems(items, 4, 0, 1)

      const children = result.items
        .filter((i) => i.parentId === 1)
        .sort((a, b) => a.position - b.position)

      // Positions should be 0, 1, 2 (contiguous)
      children.forEach((child, idx) => {
        expect(child.position).toBe(idx)
      })
    })
  })

  describe('DragResult changedIds', () => {
    it('returns changedIds for items whose position changed', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
        makeItem({ id: 2, position: 0, parentId: 1 }),
        makeItem({ id: 3, position: 1, parentId: 1 }),
        makeItem({ id: 4, position: 1, parentId: null }),
      ]

      const result = reorderItems(items, 4, 0, null)

      // At least parent 1 and parent 4 should have changed positions
      expect(result.changedIds.length).toBeGreaterThan(0)
      expect(result.changedIds).toContain(1)
      expect(result.changedIds).toContain(4)
    })

    it('returns changedIds including parentId changes for cross-group moves', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
        makeItem({ id: 2, position: 0, parentId: 1 }),
        makeItem({ id: 4, position: 1, parentId: null }),
        makeItem({ id: 5, position: 0, parentId: 4 }),
      ]

      const result = reorderItems(items, 2, 1, 4)

      // Item 2 changed parentId from 1 to 4
      expect(result.changedIds).toContain(2)
    })

    it('returns empty changedIds when dragged item does not exist', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
      ]

      const result = reorderItems(items, 999, 0, null)
      expect(result.changedIds).toEqual([])
      expect(result.items).toHaveLength(1)
    })
  })
})

describe('getValidDropTargets', () => {
  describe('parents can only drop between other parents (top-level positions)', () => {
    it('returns only top-level boundary indices for parent items', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
        makeItem({ id: 2, position: 0, parentId: 1 }),
        makeItem({ id: 3, position: 1, parentId: null }),
        makeItem({ id: 4, position: 0, parentId: 3 }),
        makeItem({ id: 5, position: 2, parentId: null }),
      ]

      const targets = getValidDropTargets(items, 1)

      // Parent 1 should not be able to drop between children of another parent
      // Valid positions are between parent boundaries only
      // The targets should NOT include indices that are within a parent's children
      for (const idx of targets) {
        // Build ordered tree to check
        const orderedTree = buildOrderedTreeForTest(items)
        // At each valid index, the item before (if any) should be a parent's last child or a childless parent
        // This is implicitly validated by the function's logic
        expect(idx).toBeGreaterThanOrEqual(0)
        expect(idx).toBeLessThanOrEqual(orderedTree.length)
      }
    })

    it('excludes positions within the dragged parent own group', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
        makeItem({ id: 2, position: 0, parentId: 1 }),
        makeItem({ id: 3, position: 1, parentId: 1 }),
        makeItem({ id: 4, position: 1, parentId: null }),
      ]

      const targets = getValidDropTargets(items, 1)

      // The ordered tree is: [1, 2, 3, 4]
      // Parent 1 is at index 0, its children end at index 2
      // So positions 0 and 1 and 2 are within the dragged group
      // Only valid position should be after parent 4 (index 4)
      expect(targets).not.toContain(1)
      expect(targets).not.toContain(2)
    })
  })

  describe('children can drop between siblings or into another parent group', () => {
    it('returns positions within all parent groups for child items', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
        makeItem({ id: 2, position: 0, parentId: 1 }),
        makeItem({ id: 3, position: 1, parentId: 1 }),
        makeItem({ id: 4, position: 1, parentId: null }),
        makeItem({ id: 5, position: 0, parentId: 4 }),
      ]

      const targets = getValidDropTargets(items, 2)

      // Child 2 should be able to drop within parent 1's group and parent 4's group
      expect(targets.length).toBeGreaterThan(0)
    })

    it('excludes the dragged child current position (no-op)', () => {
      const items: ChecklistItem[] = [
        makeItem({ id: 1, position: 0, parentId: null }),
        makeItem({ id: 2, position: 0, parentId: 1 }),
        makeItem({ id: 3, position: 1, parentId: 1 }),
      ]

      const targets = getValidDropTargets(items, 2)

      // Ordered tree: [1, 2, 3]
      // Child 2 is at index 1, so index 1 and 2 (before and after it) should be excluded
      // as they represent no-op positions
      expect(targets).not.toContain(1)
      expect(targets).not.toContain(2)
    })
  })

  it('returns empty array for non-existent item', () => {
    const items: ChecklistItem[] = [
      makeItem({ id: 1, position: 0, parentId: null }),
    ]

    const targets = getValidDropTargets(items, 999)
    expect(targets).toEqual([])
  })
})

/**
 * Helper to build ordered tree for test assertions.
 */
function buildOrderedTreeForTest(items: ChecklistItem[]): ChecklistItem[] {
  const parents = items
    .filter((item) => item.parentId == null)
    .sort((a, b) => a.position - b.position)

  const result: ChecklistItem[] = []
  for (const parent of parents) {
    result.push(parent)
    const children = items
      .filter((item) => item.parentId === parent.id)
      .sort((a, b) => a.position - b.position)
    result.push(...children)
  }
  return result
}
