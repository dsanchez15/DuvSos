import { ChecklistItem } from '@/types/checklist'

export interface DragResult {
  items: ChecklistItem[]
  changedIds: number[]
}

/**
 * Strips the time component from a Date, returning a new Date
 * set to midnight (00:00:00.000) of the same calendar day.
 */
function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Determines if a checklist is expired by comparing date portions only.
 * Returns true if and only if the current local calendar date is strictly
 * after the endDate calendar date.
 */
export function isExpired(endDate: Date, now?: Date): boolean {
  const today = stripTime(now ?? new Date())
  const end = stripTime(endDate)
  return today.getTime() > end.getTime()
}

/**
 * Computes days remaining until expiration.
 * Returns 1 when today equals endDate.
 * Compares date portions only (ignores time).
 */
export function daysRemaining(endDate: Date, now?: Date): number {
  const today = stripTime(now ?? new Date())
  const end = stripTime(endDate)
  const diffMs = end.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

/**
 * Returns { completed, total } for direct children of a parent.
 * Only counts items whose parentId equals the given parentId.
 */
export function getSubtaskProgress(
  items: ChecklistItem[],
  parentId: number
): { completed: number; total: number } {
  const children = items.filter((item) => item.parentId === parentId)
  const completed = children.filter((item) => item.completed).length
  return { completed, total: children.length }
}

/**
 * Returns true iff all direct children of the given parent are completed.
 * If no children exist, returns false.
 */
export function isParentAutoCompleted(
  items: ChecklistItem[],
  parentId: number
): boolean {
  const children = items.filter((item) => item.parentId === parentId)
  if (children.length === 0) return false
  return children.every((item) => item.completed)
}

/**
 * Builds a flat ordered list representing the tree structure:
 * each parent followed by its children sorted by position.
 * Parents are sorted by position among themselves.
 */
export function buildOrderedTree(items: ChecklistItem[]): ChecklistItem[] {
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

/**
 * Reassigns position values so that children of the same parent
 * have contiguous 0-based positions, and parents have 0-based
 * positions among themselves.
 */
function reassignPositions(items: ChecklistItem[]): ChecklistItem[] {
  const parentPositionCounter = new Map<number | null, number>()

  return items.map((item) => {
    const groupKey = item.parentId ?? null
    const currentPos = parentPositionCounter.get(groupKey) ?? 0
    parentPositionCounter.set(groupKey, currentPos + 1)
    return { ...item, position: currentPos }
  })
}

/**
 * Computes the new item list after a drag-and-drop operation.
 * Handles parent moves (with children), intra-group child moves,
 * and cross-group child moves.
 *
 * @param items - Current list of all checklist items
 * @param draggedId - ID of the item being dragged
 * @param dropIndex - Target index in the flat ordered tree representation
 * @param newParentId - The parentId for the dropped item (null for top-level)
 */
export function reorderItems(
  items: ChecklistItem[],
  draggedId: number,
  dropIndex: number,
  newParentId: number | null
): DragResult {
  const draggedItem = items.find((item) => item.id === draggedId)
  if (!draggedItem) {
    return { items: [...items], changedIds: [] }
  }

  const isParent = draggedItem.parentId == null
  const orderedTree = buildOrderedTree(items)

  if (isParent) {
    // Parent move: relocate parent and all its children together
    const children = items
      .filter((item) => item.parentId === draggedId)
      .sort((a, b) => a.position - b.position)
    const draggedGroup = [draggedItem, ...children]
    const draggedIds = new Set(draggedGroup.map((item) => item.id))

    // Remove the dragged group from the ordered tree
    const withoutDragged = orderedTree.filter((item) => !draggedIds.has(item.id))

    // Clamp dropIndex to valid range
    const clampedIndex = Math.max(0, Math.min(dropIndex, withoutDragged.length))

    // Insert the dragged group at the drop position
    const newTree = [
      ...withoutDragged.slice(0, clampedIndex),
      ...draggedGroup,
      ...withoutDragged.slice(clampedIndex),
    ]

    // Reassign positions
    const result = reassignPositions(newTree)

    // Determine which items changed
    const changedIds = result.filter((newItem) => {
      const original = items.find((o) => o.id === newItem.id)
      return (
        original &&
        (original.position !== newItem.position ||
          original.parentId !== newItem.parentId)
      )
    }).map((item) => item.id)

    return { items: result, changedIds }
  } else {
    // Child move (intra-group or cross-group)
    const updatedDraggedItem = { ...draggedItem, parentId: newParentId }

    // Get siblings in the target group (excluding the dragged item)
    const targetSiblings = items
      .filter(
        (item) =>
          item.parentId === newParentId && item.id !== draggedId
      )
      .sort((a, b) => a.position - b.position)

    // Clamp dropIndex within the sibling list
    const clampedIndex = Math.max(0, Math.min(dropIndex, targetSiblings.length))

    // Insert dragged item at the target position among siblings
    const newSiblings = [
      ...targetSiblings.slice(0, clampedIndex),
      updatedDraggedItem,
      ...targetSiblings.slice(clampedIndex),
    ]

    // Build the full item list with updated positions
    // Start with all items that are NOT in the target group and NOT the dragged item
    const otherItems = items.filter(
      (item) =>
        item.id !== draggedId &&
        item.parentId !== newParentId
    )

    // If the dragged item was in a different group, we also need to
    // reassign positions for the source group (without the dragged item)
    const sourceParentId = draggedItem.parentId
    let sourceGroupItems: ChecklistItem[] = []
    if (sourceParentId !== newParentId) {
      sourceGroupItems = items
        .filter(
          (item) =>
            item.parentId === sourceParentId && item.id !== draggedId
        )
        .sort((a, b) => a.position - b.position)
        .map((item, idx) => ({ ...item, position: idx }))

      // Remove source group items from otherItems (we'll add them back with new positions)
      const sourceGroupIds = new Set(sourceGroupItems.map((i) => i.id))
      const filteredOtherItems = otherItems.filter(
        (item) => !sourceGroupIds.has(item.id)
      )

      // Assign positions to new siblings
      const positionedNewSiblings = newSiblings.map((item, idx) => ({
        ...item,
        position: idx,
      }))

      // Combine everything
      const allItems = [
        ...filteredOtherItems,
        ...sourceGroupItems,
        ...positionedNewSiblings,
      ]

      // Rebuild the ordered tree and reassign parent positions
      const parents = allItems
        .filter((item) => item.parentId == null)
        .sort((a, b) => a.position - b.position)

      const finalResult: ChecklistItem[] = []
      let parentPos = 0
      for (const parent of parents) {
        finalResult.push({ ...parent, position: parentPos })
        parentPos++
        const children = allItems
          .filter((item) => item.parentId === parent.id)
          .sort((a, b) => a.position - b.position)
        children.forEach((child, idx) => {
          finalResult.push({ ...child, position: idx })
        })
      }

      const changedIds = finalResult.filter((newItem) => {
        const original = items.find((o) => o.id === newItem.id)
        return (
          original &&
          (original.position !== newItem.position ||
            original.parentId !== newItem.parentId)
        )
      }).map((item) => item.id)

      return { items: finalResult, changedIds }
    } else {
      // Intra-group move: just reorder within the same parent
      const positionedNewSiblings = newSiblings.map((item, idx) => ({
        ...item,
        position: idx,
      }))

      // Combine with other items
      const allItems = [...otherItems, ...positionedNewSiblings]

      // Rebuild the ordered tree
      const parents = allItems
        .filter((item) => item.parentId == null)
        .sort((a, b) => a.position - b.position)

      const finalResult: ChecklistItem[] = []
      let parentPos = 0
      for (const parent of parents) {
        finalResult.push({ ...parent, position: parentPos })
        parentPos++
        const children = allItems
          .filter((item) => item.parentId === parent.id)
          .sort((a, b) => a.position - b.position)
        children.forEach((child, idx) => {
          finalResult.push({ ...child, position: idx })
        })
      }

      const changedIds = finalResult.filter((newItem) => {
        const original = items.find((o) => o.id === newItem.id)
        return (
          original &&
          (original.position !== newItem.position ||
            original.parentId !== newItem.parentId)
        )
      }).map((item) => item.id)

      return { items: finalResult, changedIds }
    }
  }
}

/**
 * Returns valid drop indices for a given dragged item.
 * Parents can only drop between other parents (top-level positions).
 * Children can drop between siblings of any parent group.
 *
 * Returns indices in the flat ordered tree representation where
 * the item can be dropped.
 */
export function getValidDropTargets(
  items: ChecklistItem[],
  draggedId: number
): number[] {
  const draggedItem = items.find((item) => item.id === draggedId)
  if (!draggedItem) return []

  const orderedTree = buildOrderedTree(items)
  const isParent = draggedItem.parentId == null

  if (isParent) {
    // Parents can only drop between top-level positions
    // Valid positions are: before the first parent, between parents, after the last parent
    // In the flat tree, these are indices where a parent boundary exists
    const validIndices: number[] = []

    // Index 0 is always valid (before everything)
    validIndices.push(0)

    for (let i = 0; i < orderedTree.length; i++) {
      const current = orderedTree[i]
      // A valid drop position is after a parent's last child (or after the parent itself if no children)
      if (current.parentId == null) {
        // Find the last child of this parent
        const children = items.filter((item) => item.parentId === current.id)
        if (children.length > 0) {
          // Find the index of the last child in the ordered tree
          const lastChildIdx = orderedTree.findLastIndex(
            (item) => item.parentId === current.id
          )
          if (lastChildIdx >= 0 && !validIndices.includes(lastChildIdx + 1)) {
            validIndices.push(lastChildIdx + 1)
          }
        } else {
          // No children, valid position is right after this parent
          if (!validIndices.includes(i + 1)) {
            validIndices.push(i + 1)
          }
        }
      }
    }

    // Filter out positions that are within the dragged parent's own group
    const draggedChildren = items.filter((item) => item.parentId === draggedId)
    const draggedGroupIds = new Set([draggedId, ...draggedChildren.map((c) => c.id)])
    const draggedStartIdx = orderedTree.findIndex((item) => item.id === draggedId)
    const draggedEndIdx = draggedStartIdx + draggedChildren.length

    return validIndices.filter((idx) => {
      // Exclude positions that are within the dragged group
      return idx <= draggedStartIdx || idx > draggedEndIdx
    }).sort((a, b) => a - b)
  } else {
    // Children can drop between siblings of any parent group
    const validIndices: number[] = []

    // Find all parent groups
    const parents = items.filter((item) => item.parentId == null)

    for (const parent of parents) {
      const children = orderedTree.filter((item) => item.parentId === parent.id)
      if (children.length === 0) {
        // Can drop as first child of this parent
        const parentIdx = orderedTree.findIndex((item) => item.id === parent.id)
        validIndices.push(parentIdx + 1)
      } else {
        // Can drop before first child, between children, or after last child
        const firstChildIdx = orderedTree.findIndex(
          (item) => item.parentId === parent.id
        )
        const lastChildIdx = orderedTree.findLastIndex(
          (item) => item.parentId === parent.id
        )

        // Before first child
        validIndices.push(firstChildIdx)
        // Between and after each child
        for (let i = firstChildIdx; i <= lastChildIdx; i++) {
          if (orderedTree[i].parentId === parent.id) {
            validIndices.push(i + 1)
          }
        }
      }
    }

    // Remove duplicates and sort
    const uniqueIndices = [...new Set(validIndices)].sort((a, b) => a - b)

    // Filter out the dragged item's current position (no-op drop)
    const draggedIdx = orderedTree.findIndex((item) => item.id === draggedId)
    return uniqueIndices.filter(
      (idx) => idx !== draggedIdx && idx !== draggedIdx + 1
    )
  }
}

/**
 * Computes the blocker update payload for the edit form.
 * Returns an object with `blockedByItemId` set appropriately:
 * - If editBlockedBy is '' (No Blocker) and item has a blocker → { blockedByItemId: null }
 * - If editBlockedBy is '' and item has no blocker → {} (no change)
 * - If editBlockedBy is a number different from current → { blockedByItemId: number }
 * - If editBlockedBy equals current blocker → {} (no change)
 */
export function computeBlockerPayload(
  currentBlockerValue: number | null,
  editBlockedBy: number | ''
): { blockedByItemId?: number | null } {
  const updates: { blockedByItemId?: number | null } = {}
  const currentBlocker = currentBlockerValue ?? null

  if (editBlockedBy === '') {
    if (currentBlocker !== null) {
      updates.blockedByItemId = null
    }
  } else {
    const newBlocker = Number(editBlockedBy)
    if (newBlocker !== currentBlocker) {
      updates.blockedByItemId = newBlocker
    }
  }

  return updates
}

/**
 * Find the closest valid drop target to the given tree index.
 * Returns null when there are no valid targets.
 */
export function findClosestValidTarget(treeIdx: number, targets: number[]): number | null {
  if (targets.length === 0) return null
  let closest = targets[0]
  let minDist = Math.abs(targets[0] - treeIdx)
  for (const t of targets) {
    const dist = Math.min(Math.abs(t - treeIdx), Math.abs(t - (treeIdx + 1)))
    if (dist < minDist) {
      minDist = dist
      closest = t
    }
  }
  return closest
}

/**
 * Determine the new parentId based on where the item is being dropped.
 * Parents always stay at top level; children join the parent group of
 * the drop position.
 */
export function determineNewParentId(
  orderedTree: ChecklistItem[],
  dropIdx: number,
  draggedItem: ChecklistItem
): number | null {
  const isParent = draggedItem.parentId == null
  if (isParent) return null

  if (dropIdx === 0) {
    const firstParent = orderedTree.find((i) => i.parentId == null)
    return firstParent?.id ?? null
  }

  const itemBefore = orderedTree[dropIdx - 1]
  if (!itemBefore) return null

  if (itemBefore.parentId == null) {
    return itemBefore.id
  }
  return itemBefore.parentId
}

/**
 * Compute the drop index within the target group. For parent moves it is
 * the flat tree position; for child moves, the position among the target
 * parent's children.
 */
export function computeDropIndex(
  orderedTree: ChecklistItem[],
  dropIdx: number,
  newParentId: number | null,
  draggedItem: ChecklistItem
): number {
  const isParent = draggedItem.parentId == null
  if (isParent) return dropIdx

  const targetChildren = orderedTree.filter(
    (i) => i.parentId === newParentId && i.id !== draggedItem.id
  )

  let childPosition = 0
  for (const child of targetChildren) {
    const childIdx = orderedTree.findIndex((i) => i.id === child.id)
    if (childIdx < dropIdx) childPosition++
  }
  return childPosition
}
