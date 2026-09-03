'use client'

import { useState, useCallback } from 'react'
import { buildOrderedTree } from '@/lib/checklist-utils'
import { useChecklistDragDrop } from '@/hooks/useChecklistDragDrop'
import { useAppTranslation } from '@/components/LanguageProvider'
import ChecklistItemRow from './ChecklistItemRow'
import InlineItemInput from './InlineItemInput'
import UndoToast from './UndoToast'
import type { Checklist, ChecklistItem, Priority } from '@/types/checklist'

interface ExpandedItemsProps {
  checklist: Checklist
  onToggleItem: (checklistId: number, item: ChecklistItem) => void
  onUpdateItem: (checklistId: number, item: ChecklistItem, data: Partial<ChecklistItem>) => void
  onDeleteItem: (checklistId: number, itemId: number) => void
  onAddItem: (checklistId: number, title: string, priority: Priority, parentId?: number | null) => void
  onReorder: (checklistId: number, items: ChecklistItem[]) => Promise<void>
  onCreateReminder: (checklistId: number, item: ChecklistItem) => void
  mode: 'active' | 'template' | 'history'
}

export default function ExpandedItems({
  checklist: c,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onReorder,
  onCreateReminder,
  mode,
}: ExpandedItemsProps) {
  const { t } = useAppTranslation()
  const [hideCompleted, setHideCompleted] = useState(false)
  const [undoItem, setUndoItem] = useState<{ item: ChecklistItem; timer: NodeJS.Timeout } | null>(null)

  const itemsList = Array.isArray(c.items) ? c.items : []

  // Collapse/expand state: track which parents are collapsed (default: all collapsed)
  const [collapsedParents, setCollapsedParents] = useState<Set<number>>(() => {
    const parents = itemsList
      .filter((i) => !i.parentId || i.parentId === null)
      .filter((parent) => itemsList.some((child) => child.parentId === parent.id))
      .map((p) => p.id)
    return new Set(parents)
  })

  const parentsWithChildren = new Set(
    itemsList.filter((i) => i.parentId != null).map((i) => i.parentId as number)
  )

  const toggleCollapse = (parentId: number) => {
    setCollapsedParents((prev) => {
      const next = new Set(prev)
      if (next.has(parentId)) next.delete(parentId)
      else next.add(parentId)
      return next
    })
  }

  const buildTree = (
    items: ChecklistItem[],
    parentId: number | null = null,
    depth = 0
  ): Array<{ item: ChecklistItem; depth: number }> => {
    const result: Array<{ item: ChecklistItem; depth: number }> = []
    items
      .filter((i) => i.parentId === parentId)
      .forEach((item) => {
        result.push({ item, depth })
        if (!collapsedParents.has(item.id)) {
          result.push(...buildTree(items, item.id, depth + 1))
        }
      })
    return result
  }

  const treeItems = buildTree(itemsList)

  const getVisibleItems = () => {
    let items = [...treeItems]
    if (undoItem) items = items.filter((i) => i.item.id !== undoItem.item.id)
    if (hideCompleted) items = items.filter((i) => !i.item.completed)
    return items.map((t) => t.item)
  }

  const visibleItems = getVisibleItems()
  const completedCount = itemsList.filter((i) => i.completed).length

  const {
    draggedId,
    dropIndicatorIndex,
    dragError,
    setDragError,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useChecklistDragDrop({ checklistId: c.id, itemsList, visibleItems, onReorder, t })

  const handleDeleteItem = (itemId: number) => {
    const item = itemsList.find((i) => i.id === itemId)
    if (!item) return
    if (undoItem) {
      clearTimeout(undoItem.timer)
      onDeleteItem(c.id, undoItem.item.id)
    }
    const timer = setTimeout(() => {
      onDeleteItem(c.id, itemId)
      setUndoItem(null)
    }, 5000)
    setUndoItem({ item, timer })
  }

  const handleUndo = () => {
    if (!undoItem) return
    clearTimeout(undoItem.timer)
    setUndoItem(null)
  }

  const dismissUndo = useCallback(() => {
    if (!undoItem) return
    clearTimeout(undoItem.timer)
    onDeleteItem(c.id, undoItem.item.id)
    setUndoItem(null)
  }, [undoItem, c.id, onDeleteItem])

  const isBlocked = (item: ChecklistItem) => {
    if (!item.blockedByItemId) return false
    const blocker = itemsList.find((i) => i.id === item.blockedByItemId)
    return !!blocker && !blocker.completed
  }

  const orderedTree = buildOrderedTree(itemsList)

  return (
    <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'var(--color-border)' }}>
      {completedCount > 0 && mode !== 'history' && (
        <div className="mb-2 flex items-center justify-end">
          <button
            onClick={() => setHideCompleted(!hideCompleted)}
            className="checklist-hide-toggle flex items-center gap-1 text-xs text-text-muted"
          >
            <span className="material-symbols-outlined text-xs">
              {hideCompleted ? 'visibility' : 'visibility_off'}
            </span>
            {hideCompleted
              ? t('checklists.expandedItems.showCompleted', { count: completedCount })
              : t('checklists.expandedItems.hideCompleted')}
          </button>
        </div>
      )}

      {visibleItems.length === 0 ? (
        <p className="py-3 text-center text-sm text-text-muted">
          {hideCompleted
            ? t('checklists.expandedItems.allCompleted')
            : t('checklists.expandedItems.noItems')}
        </p>
      ) : (
        <div className="space-y-1">
          {visibleItems.map((item, idx) => {
            const depth = treeItems.find((ti) => ti.item.id === item.id)?.depth || 0
            const treeIdx = orderedTree.findIndex((i) => i.id === item.id)
            const showDropBefore = draggedId !== null && dropIndicatorIndex === treeIdx
            const showDropAfter =
              draggedId !== null &&
              idx === visibleItems.length - 1 &&
              dropIndicatorIndex === orderedTree.length
            return (
              <div key={item.id}>
                {showDropBefore && (
                  <div
                    className="my-0.5 h-0.5 rounded-full bg-primary transition-all"
                    style={{ marginLeft: `${depth * 20}px` }}
                  />
                )}
                <div
                  draggable={mode !== 'history'}
                  onDragStart={() => handleDragStart(item.id)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <ChecklistItemRow
                    checklistId={c.id}
                    item={item}
                    itemsList={itemsList}
                    depth={depth}
                    mode={mode}
                    blocked={isBlocked(item)}
                    hasChildren={parentsWithChildren.has(item.id)}
                    isCollapsed={collapsedParents.has(item.id)}
                    isDragged={draggedId === item.id}
                    onToggleCollapse={toggleCollapse}
                    onToggleItem={onToggleItem}
                    onUpdateItem={onUpdateItem}
                    onDeleteItem={handleDeleteItem}
                    onCreateReminder={onCreateReminder}
                  />
                </div>
                {showDropAfter && <div className="my-0.5 h-0.5 rounded-full bg-primary transition-all" />}
              </div>
            )
          })}
        </div>
      )}

      {mode !== 'history' && (
        <InlineItemInput
          onAdd={(title, priority, parentId) => onAddItem(c.id, title, priority, parentId)}
          checklistItems={itemsList}
        />
      )}

      {dragError && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm text-white shadow-lg">
          <span className="material-symbols-outlined text-sm">error</span>
          {dragError}
          <button onClick={() => setDragError(null)} className="ml-2 hover:opacity-80">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {undoItem && (
        <UndoToast
          message={t('checklists.expandedItems.deleted', { title: undoItem.item.title })}
          onUndo={handleUndo}
          onClose={dismissUndo}
        />
      )}
    </div>
  )
}
