/**
 * Feature: checklist-improvements, Property 1: Reorder preserves hierarchy invariants
 * Feature: checklist-improvements, Property 2: Drop target validation
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.7**
 *
 * Property 1: For any valid checklist item tree and any valid drag operation,
 * the resulting item list SHALL maintain correct parent-child grouping:
 * every child's parentId references a valid parent in the list, children of
 * the same parent are contiguous in position order, and a parent move
 * relocates all its children together preserving their internal relative order.
 *
 * Property 2: For any checklist item tree and any item being dragged,
 * the set of valid drop positions SHALL satisfy: if the dragged item is a
 * Parent_Item, valid positions are only between other top-level items;
 * if the dragged item is a Child_Item, valid positions are between siblings
 * of any parent group.
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { reorderItems, getValidDropTargets } from '@/lib/checklist-utils'
import { ChecklistItem } from '@/types/checklist'

// ─── Arbitraries ───

/**
 * Generates a valid checklist item tree with parents and children.
 * Each parent has 0-3 children. Parents have contiguous 0-based positions.
 * Children have contiguous 0-based positions within their parent group.
 */
function arbItemTree(): fc.Arbitrary<ChecklistItem[]> {
  return fc
    .integer({ min: 1, max: 5 })
    .chain((numParents) => {
      return fc
        .array(fc.integer({ min: 0, max: 3 }), {
          minLength: numParents,
          maxLength: numParents,
        })
        .map((childCounts) => {
          const items: ChecklistItem[] = []
          let nextId = 1

          for (let p = 0; p < numParents; p++) {
            const parentId = nextId++
            items.push(makeItem({ id: parentId, position: p, parentId: null }))

            const numChildren = childCounts[p]
            for (let c = 0; c < numChildren; c++) {
              items.push(
                makeItem({ id: nextId++, position: c, parentId: parentId })
              )
            }
          }

          return items
        })
    })
}

/**
 * Generates a valid item tree paired with a valid parent drag operation.
 * Returns the tree, the dragged parent id, and a valid drop index.
 */
function arbParentDragOperation(): fc.Arbitrary<{
  items: ChecklistItem[]
  draggedId: number
  dropIndex: number
}> {
  return arbItemTree()
    .filter((items) => items.filter((i) => i.parentId == null).length >= 2)
    .chain((items) => {
      const parents = items.filter((i) => i.parentId == null)
      const parentIds = parents.map((p) => p.id)

      return fc
        .constantFrom(...parentIds)
        .chain((draggedId) => {
          const targets = getValidDropTargets(items, draggedId)
          if (targets.length === 0) {
            // Fallback: use index 0
            return fc.constant({ items, draggedId, dropIndex: 0 })
          }
          return fc.constantFrom(...targets).map((dropIndex) => ({
            items,
            draggedId,
            dropIndex,
          }))
        })
    })
}

/**
 * Generates a valid item tree paired with a valid child drag operation.
 * Returns the tree, the dragged child id, drop index, and new parent id.
 */
function arbChildDragOperation(): fc.Arbitrary<{
  items: ChecklistItem[]
  draggedId: number
  dropIndex: number
  newParentId: number | null
}> {
  return arbItemTree()
    .filter((items) => items.some((i) => i.parentId != null))
    .chain((items) => {
      const children = items.filter((i) => i.parentId != null)
      const childIds = children.map((c) => c.id)
      const parents = items.filter((i) => i.parentId == null)

      return fc.constantFrom(...childIds).chain((draggedId) => {
        // Pick a target parent group
        return fc.constantFrom(...parents.map((p) => p.id)).chain((newParentId) => {
          // Compute valid drop index within the target group
          const siblings = items.filter(
            (i) => i.parentId === newParentId && i.id !== draggedId
          )
          const maxIdx = siblings.length
          return fc.integer({ min: 0, max: maxIdx }).map((dropIndex) => ({
            items,
            draggedId,
            dropIndex,
            newParentId,
          }))
        })
      })
    })
}

function makeItem(
  overrides: Partial<ChecklistItem> & { id: number }
): ChecklistItem {
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

// ─── Helper functions ───

/**
 * Builds the flat ordered tree (parents sorted by position, each followed by children sorted by position).
 */
function buildOrderedTree(items: ChecklistItem[]): ChecklistItem[] {
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

// ─── Property 1: Reorder preserves hierarchy invariants ───

describe('Property 1: Reorder preserves hierarchy invariants', () => {
  // Feature: checklist-improvements, Property 1: Reorder preserves hierarchy invariants

  it('parent drag: every child parentId references a valid parent in the result', () => {
    fc.assert(
      fc.property(arbParentDragOperation(), ({ items, draggedId, dropIndex }) => {
        const result = reorderItems(items, draggedId, dropIndex, null)
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

  it('parent drag: children of the same parent are contiguous in position order (0-based)', () => {
    fc.assert(
      fc.property(arbParentDragOperation(), ({ items, draggedId, dropIndex }) => {
        const result = reorderItems(items, draggedId, dropIndex, null)
        const parents = result.items.filter((i) => i.parentId == null)

        for (const parent of parents) {
          const children = result.items
            .filter((i) => i.parentId === parent.id)
            .sort((a, b) => a.position - b.position)

          // Positions should be 0-based and contiguous
          children.forEach((child, idx) => {
            expect(child.position).toBe(idx)
          })
        }
      }),
      { numRuns: 100 }
    )
  })

  it('parent drag: parent move relocates all children together preserving internal relative order', () => {
    fc.assert(
      fc.property(arbParentDragOperation(), ({ items, draggedId, dropIndex }) => {
        // Get original children order
        const originalChildren = items
          .filter((i) => i.parentId === draggedId)
          .sort((a, b) => a.position - b.position)
          .map((i) => i.id)

        const result = reorderItems(items, draggedId, dropIndex, null)

        // After reorder, children of the dragged parent should maintain relative order
        const resultChildren = result.items
          .filter((i) => i.parentId === draggedId)
          .sort((a, b) => a.position - b.position)
          .map((i) => i.id)

        expect(resultChildren).toEqual(originalChildren)
      }),
      { numRuns: 100 }
    )
  })

  it('child drag: every child parentId references a valid parent in the result', () => {
    fc.assert(
      fc.property(
        arbChildDragOperation(),
        ({ items, draggedId, dropIndex, newParentId }) => {
          const result = reorderItems(items, draggedId, dropIndex, newParentId)
          const parentIds = new Set(
            result.items.filter((i) => i.parentId == null).map((i) => i.id)
          )

          for (const item of result.items) {
            if (item.parentId != null) {
              expect(parentIds.has(item.parentId)).toBe(true)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('child drag: children of the same parent are contiguous in position order (0-based)', () => {
    fc.assert(
      fc.property(
        arbChildDragOperation(),
        ({ items, draggedId, dropIndex, newParentId }) => {
          const result = reorderItems(items, draggedId, dropIndex, newParentId)
          const parents = result.items.filter((i) => i.parentId == null)

          for (const parent of parents) {
            const children = result.items
              .filter((i) => i.parentId === parent.id)
              .sort((a, b) => a.position - b.position)

            children.forEach((child, idx) => {
              expect(child.position).toBe(idx)
            })
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('parent drag: in the ordered tree, children appear immediately after their parent', () => {
    fc.assert(
      fc.property(arbParentDragOperation(), ({ items, draggedId, dropIndex }) => {
        const result = reorderItems(items, draggedId, dropIndex, null)
        const orderedTree = buildOrderedTree(result.items)

        for (let i = 0; i < orderedTree.length; i++) {
          const item = orderedTree[i]
          if (item.parentId == null) {
            // All items immediately following this parent (until next parent) should be its children
            for (let j = i + 1; j < orderedTree.length; j++) {
              if (orderedTree[j].parentId == null) break
              expect(orderedTree[j].parentId).toBe(item.id)
            }
          }
        }
      }),
      { numRuns: 100 }
    )
  })
})

// ─── Property 2: Drop target validation ───

describe('Property 2: Drop target validation', () => {
  // Feature: checklist-improvements, Property 2: Drop target validation

  it('parent items: valid drop positions are only between top-level items', () => {
    fc.assert(
      fc.property(
        arbItemTree().filter(
          (items) => items.filter((i) => i.parentId == null).length >= 2
        ),
        (items) => {
          const parents = items.filter((i) => i.parentId == null)

          for (const parent of parents) {
            const targets = getValidDropTargets(items, parent.id)
            const orderedTree = buildOrderedTree(items)

            for (const idx of targets) {
              // A valid drop index for a parent must be at a top-level boundary:
              // either index 0 (before first item), or right after a parent's last child/itself
              if (idx === 0) continue // Before everything is always valid for parents
              if (idx >= orderedTree.length) continue // After everything is valid

              // The item just before the drop index should be either:
              // - A parent with no children (the parent itself)
              // - The last child of some parent
              const itemBefore = orderedTree[idx - 1]
              if (itemBefore.parentId == null) {
                // It's a parent — valid if it has no children
                const hasChildren = items.some((i) => i.parentId === itemBefore.id)
                if (hasChildren) {
                  // This shouldn't happen — if parent has children, the drop should be after last child
                  // But it's still a valid boundary if no children follow in the tree
                  const nextItem = orderedTree[idx]
                  if (nextItem) {
                    expect(nextItem.parentId).not.toBe(itemBefore.id)
                  }
                }
              } else {
                // It's a child — check it's the last child of its parent
                const siblingAfter = orderedTree[idx]
                if (siblingAfter) {
                  // The next item should NOT be a child of the same parent
                  // (unless it's a different parent boundary)
                  // Actually for parent drops, the next item should be a parent or end of list
                  expect(
                    siblingAfter.parentId == null ||
                      siblingAfter.parentId !== itemBefore.parentId ||
                      idx === orderedTree.length
                  ).toBe(true)
                }
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('child items: valid drop positions are between siblings of any parent group', () => {
    fc.assert(
      fc.property(
        arbItemTree().filter((items) => items.some((i) => i.parentId != null)),
        (items) => {
          const children = items.filter((i) => i.parentId != null)
          const parents = items.filter((i) => i.parentId == null)
          const orderedTree = buildOrderedTree(items)

          for (const child of children) {
            const targets = getValidDropTargets(items, child.id)

            for (const idx of targets) {
              // Each valid target for a child must be within some parent's child zone
              // A child zone is: right after the parent (index of parent + 1) through
              // the last child of that parent (or parent + 1 if no children)
              let isInChildZone = false

              for (const parent of parents) {
                const parentIdx = orderedTree.findIndex((i) => i.id === parent.id)
                const parentChildren = orderedTree.filter(
                  (i) => i.parentId === parent.id
                )

                // Child zone starts right after parent
                const zoneStart = parentIdx + 1
                // Child zone ends after the last child (or at zoneStart if no children)
                const zoneEnd = zoneStart + parentChildren.length

                if (idx >= zoneStart && idx <= zoneEnd) {
                  isInChildZone = true
                  break
                }
              }

              expect(isInChildZone).toBe(true)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('parent items: drop targets never include positions within another parent children block', () => {
    fc.assert(
      fc.property(
        arbItemTree().filter(
          (items) =>
            items.filter((i) => i.parentId == null).length >= 2 &&
            items.some((i) => i.parentId != null)
        ),
        (items) => {
          const parents = items.filter((i) => i.parentId == null)
          const orderedTree = buildOrderedTree(items)

          for (const parent of parents) {
            const targets = getValidDropTargets(items, parent.id)

            for (const idx of targets) {
              // This index should NOT be in the middle of another parent's children
              if (idx > 0 && idx < orderedTree.length) {
                const before = orderedTree[idx - 1]
                const after = orderedTree[idx]

                // If both before and after are children of the same parent, this is invalid
                if (
                  before.parentId != null &&
                  after &&
                  after.parentId === before.parentId
                ) {
                  // This should not happen for parent drops
                  expect(false).toBe(true)
                }
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('returns empty array for non-existent item', () => {
    fc.assert(
      fc.property(arbItemTree(), (items) => {
        const maxId = Math.max(...items.map((i) => i.id))
        const targets = getValidDropTargets(items, maxId + 100)
        expect(targets).toEqual([])
      }),
      { numRuns: 100 }
    )
  })
})
