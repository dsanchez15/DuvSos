'use client'

import { useState } from 'react'
import {
  buildOrderedTree,
  computeDropIndex,
  determineNewParentId,
  findClosestValidTarget,
  getValidDropTargets,
  reorderItems,
} from '@/lib/checklist-utils'
import type { ChecklistItem } from '@/types/checklist'

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

interface UseChecklistDragDropOptions {
  checklistId: number
  itemsList: ChecklistItem[]
  visibleItems: ChecklistItem[]
  onReorder: (checklistId: number, items: ChecklistItem[]) => Promise<void>
  t: TranslateFn
}

/**
 * Hierarchy-aware drag-and-drop state and handlers for checklist items.
 * Applies the reorder optimistically and rolls back on API failure.
 */
export function useChecklistDragDrop({
  checklistId,
  itemsList,
  visibleItems,
  onReorder,
  t,
}: UseChecklistDragDropOptions) {
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null)
  const [validDropTargets, setValidDropTargets] = useState<number[]>([])
  const [dragError, setDragError] = useState<string | null>(null)

  const resetDragState = () => {
    setDraggedId(null)
    setDropIndicatorIndex(null)
    setValidDropTargets([])
  }

  const handleDragStart = (itemId: number) => {
    setDraggedId(itemId)
    setValidDropTargets(getValidDropTargets(itemsList, itemId))
  }

  const handleDragOver = (e: React.DragEvent, visibleIdx: number) => {
    e.preventDefault()
    const orderedTree = buildOrderedTree(itemsList)
    const visibleItem = visibleItems[visibleIdx]
    if (!visibleItem) return

    const treeIdx = orderedTree.findIndex((i) => i.id === visibleItem.id)
    if (treeIdx < 0) return

    setDropIndicatorIndex(findClosestValidTarget(treeIdx, validDropTargets))
  }

  const handleDragEnd = async () => {
    if (draggedId === null || dropIndicatorIndex === null) {
      resetDragState()
      return
    }

    const orderedTree = buildOrderedTree(itemsList)
    const draggedItem = itemsList.find((i) => i.id === draggedId)
    if (!draggedItem) {
      resetDragState()
      return
    }

    const newParentId = determineNewParentId(orderedTree, dropIndicatorIndex, draggedItem)
    const dropIdx = computeDropIndex(orderedTree, dropIndicatorIndex, newParentId, draggedItem)
    const result = reorderItems(itemsList, draggedId, dropIdx, newParentId)

    if (result.changedIds.length === 0) {
      resetDragState()
      return
    }

    const preDragItems = [...itemsList]
    resetDragState()

    try {
      await onReorder(checklistId, result.items)
    } catch {
      try {
        await onReorder(checklistId, preDragItems)
      } catch {
        // best effort revert
      }
      setDragError(t('checklists.expandedItems.reorderFailed') ?? 'Failed to save reorder')
      setTimeout(() => setDragError(null), 4000)
    }
  }

  return {
    draggedId,
    dropIndicatorIndex,
    dragError,
    setDragError,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  }
}
