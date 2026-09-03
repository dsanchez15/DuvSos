'use client'

import { useState } from 'react'
import { computeBlockerPayload, getSubtaskProgress, isParentAutoCompleted } from '@/lib/checklist-utils'
import { useAppTranslation } from '@/components/LanguageProvider'
import { priorityConfig } from './helpers'
import type { ChecklistItem, Priority } from '@/types/checklist'

interface ChecklistItemRowProps {
  checklistId: number
  item: ChecklistItem
  itemsList: ChecklistItem[]
  depth: number
  mode: 'active' | 'template' | 'history'
  blocked: boolean
  hasChildren: boolean
  isCollapsed: boolean
  isDragged: boolean
  onToggleCollapse: (parentId: number) => void
  onToggleItem: (checklistId: number, item: ChecklistItem) => void
  onUpdateItem: (checklistId: number, item: ChecklistItem, data: Partial<ChecklistItem>) => void
  onDeleteItem: (itemId: number) => void
  onCreateReminder: (checklistId: number, item: ChecklistItem) => void
}

export default function ChecklistItemRow({
  checklistId,
  item,
  itemsList,
  depth,
  mode,
  blocked,
  hasChildren,
  isCollapsed,
  isDragged,
  onToggleCollapse,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onCreateReminder,
}: ChecklistItemRowProps) {
  const { t } = useAppTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editEffort, setEditEffort] = useState<number | ''>('')
  const [editBlockedBy, setEditBlockedBy] = useState<number | ''>('')
  const [showNotes, setShowNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')

  const prio = priorityConfig[item.priority as Priority] || priorityConfig.normal
  const autoCompleted = hasChildren && isParentAutoCompleted(itemsList, item.id)
  const isMuted = autoCompleted || item.completed

  const startEdit = () => {
    setEditTitle(item.title)
    setEditEffort(item.effortEstimate || '')
    setEditBlockedBy(item.blockedByItemId || '')
    setIsEditing(true)
  }

  const saveEdit = () => {
    const updates: Partial<ChecklistItem> = {}
    if (editTitle.trim() && editTitle !== item.title) updates.title = editTitle.trim()
    if (editEffort !== '') updates.effortEstimate = Number(editEffort)
    Object.assign(updates, computeBlockerPayload(item.blockedByItemId ?? null, editBlockedBy))
    if (Object.keys(updates).length > 0) onUpdateItem(checklistId, item, updates)
    setIsEditing(false)
  }

  const openNotes = () => {
    setNotesValue(item.notes || '')
    setShowNotes((prev) => !prev)
  }

  const cyclePriority = () => {
    const next: Record<string, Priority> = { normal: 'high', high: 'low', low: 'normal' }
    onUpdateItem(checklistId, item, { priority: next[item.priority] || 'normal' })
  }

  return (
    <>
      <div
        className={`checklist-item-row group/item flex items-center gap-2.5 py-1.5 ${
          isMuted ? 'opacity-60' : ''
        } ${blocked ? 'opacity-50' : ''} ${isDragged ? 'opacity-40' : ''}`}
        style={{ paddingLeft: `${depth * 20}px` }}
      >
        {mode !== 'history' && (
          <span className="material-symbols-outlined cursor-grab text-xs text-text-muted">drag_indicator</span>
        )}

        {/* Chevron toggle for parents with children */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse(item.id)
            }}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-text-muted transition-transform"
            aria-label={isCollapsed ? 'Expand children' : 'Collapse children'}
          >
            <span
              className="material-symbols-outlined text-sm transition-transform"
              style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}
            >
              chevron_right
            </span>
          </button>
        ) : depth === 0 ? (
          <span className="w-5 flex-shrink-0" />
        ) : null}

        {/* Checkbox: hidden for parents with children */}
        {hasChildren ? (
          <span className="h-5 w-5 flex-shrink-0" />
        ) : (
          <button
            onClick={() => mode === 'active' && !blocked && onToggleItem(checklistId, item)}
            role="checkbox"
            aria-checked={item.completed}
            className={`checklist-item-checkbox flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
              item.completed
                ? 'checklist-item-checkbox-checked border-primary bg-primary'
                : blocked || mode !== 'active'
                  ? 'cursor-not-allowed'
                  : 'checklist-checkbox-unchecked'
            }`}
            style={!item.completed ? { borderColor: 'var(--color-border-strong)' } : undefined}
          >
            {item.completed && <span className="material-symbols-outlined text-xs text-white">check</span>}
          </button>
        )}

        {isEditing && mode !== 'history' ? (
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit()
                if (e.key === 'Escape') setIsEditing(false)
              }}
              className="checklist-item-input flex-1 border-b-2 border-primary bg-transparent px-1 py-0.5 text-sm text-text-primary focus:outline-none"
            />
            <input
              type="number"
              value={editEffort}
              onChange={(e) => setEditEffort(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="Min"
              className="rf-input w-16 border-b bg-transparent px-1 py-0.5 text-xs text-text-primary focus:outline-none"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <select
              value={editBlockedBy}
              onChange={(e) => setEditBlockedBy(e.target.value ? parseInt(e.target.value) : '')}
              aria-label={t('checklists.expandedItems.noBlocker')}
              className="todo-select border-b bg-transparent px-1 py-0.5 text-xs text-text-primary focus:outline-none"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <option value="">{t('checklists.expandedItems.noBlocker')}</option>
              {itemsList
                .filter((i) => i.id !== item.id)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title.slice(0, 20)}
                  </option>
                ))}
            </select>
          </div>
        ) : (
          <>
            <span
              onDoubleClick={() => mode !== 'history' && startEdit()}
              className={`flex-1 text-sm ${isMuted ? 'checklist-item-completed line-through' : blocked ? 'checklist-item-blocked' : ''}`}
              style={{
                color: isMuted || blocked ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              }}
            >
              {item.title}
              {blocked && (
                <span className="checklist-item-blocked-badge ml-2 inline-flex items-center gap-0.5 text-xs text-warning">
                  <span className="material-symbols-outlined text-xs">lock</span>
                  {t('checklists.expandedItems.blocked')}
                </span>
              )}
              {item.effortEstimate ? (
                <span className="ml-2 text-xs text-text-muted">({item.effortEstimate}m)</span>
              ) : null}
            </span>
            {hasChildren && (
              <SubtaskCounter itemsList={itemsList} parentId={item.id} />
            )}
          </>
        )}

        {mode !== 'history' && (
          <>
            <button
              onClick={openNotes}
              title={item.notes || 'Add notes'}
              className={`todo-action-btn p-0.5 transition-opacity ${item.notes ? '' : 'opacity-0 group-hover/item:opacity-100'}`}
              style={{ color: item.notes ? 'var(--color-warning)' : 'var(--color-text-muted)' }}
            >
              <span className="material-symbols-outlined text-xs">sticky_note_2</span>
            </button>
            <button
              onClick={cyclePriority}
              title={`Priority: ${item.priority}`}
              className="material-symbols-outlined cursor-pointer text-xs transition-transform hover:scale-125"
              style={{ color: prio.color }}
            >
              {prio.icon}
            </button>
            <button
              onClick={startEdit}
              className="todo-action-btn p-0.5 text-text-muted opacity-0 transition-opacity hover:text-primary group-hover/item:opacity-100"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <button
              onClick={() => onCreateReminder(checklistId, item)}
              title="Set reminder"
              className="todo-action-btn checklist-action-btn-reminder p-0.5 text-text-muted opacity-0 transition-opacity group-hover/item:opacity-100"
            >
              <span className="material-symbols-outlined text-sm">notifications</span>
            </button>
            <button
              onClick={() => onDeleteItem(item.id)}
              className="todo-action-btn todo-action-btn-danger p-0.5 text-text-muted opacity-0 transition-opacity group-hover/item:opacity-100"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </>
        )}
      </div>

      {/* Notes editor */}
      {showNotes && mode !== 'history' && (
        <div className="mb-2 mt-1" style={{ marginLeft: `${depth * 20 + 40}px` }}>
          <textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            rows={2}
            placeholder={t('checklists.expandedItems.notesPlaceholder')}
            className="checklist-notes-area w-full resize-none rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="mt-1 flex gap-2">
            <button
              onClick={() => {
                onUpdateItem(checklistId, item, { notes: notesValue || null })
                setShowNotes(false)
              }}
              className="btn-neon rounded-lg bg-primary px-3 py-1 text-xs text-white hover:bg-primary/90"
            >
              {t('common.save')}
            </button>
            <button
              onClick={() => setShowNotes(false)}
              className="btn-outline checklist-cancel-btn px-3 py-1 text-xs text-text-muted"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function SubtaskCounter({ itemsList, parentId }: { itemsList: ChecklistItem[]; parentId: number }) {
  const progress = getSubtaskProgress(itemsList, parentId)
  return (
    <span className="flex-shrink-0 text-xs font-medium text-text-muted">
      {progress.completed}/{progress.total}
    </span>
  )
}
