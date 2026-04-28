'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Checklist, ChecklistCategory, ChecklistFilter, ChecklistItem, ChecklistTab, Priority } from '@/types/checklist'

const priorityConfig: Record<Priority, { icon: string; color: string }> = {
  high: { icon: 'arrow_upward', color: 'var(--color-danger)' },
  normal: { icon: 'remove', color: 'var(--color-text-muted)' },
  low: { icon: 'arrow_downward', color: 'var(--color-info)' },
}

export function getStatus(c: Checklist): { label: string; style: React.CSSProperties } {
  const successStyle: React.CSSProperties = { background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }
  const mutedStyle: React.CSSProperties = { background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-secondary)' }
  const dangerStyle: React.CSSProperties = { background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }
  const warningStyle: React.CSSProperties = { background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }
  const infoStyle: React.CSSProperties = { background: 'color-mix(in srgb, var(--color-info) 15%, transparent)', color: 'var(--color-info)' }

  if (c.lifecycleState === 'Completed') return { label: 'Completed', style: successStyle }
  if (c.lifecycleState === 'Archived') return { label: 'Archived', style: mutedStyle }
  if (!c.startDate && !c.endDate) return { label: 'No dates', style: mutedStyle }
  const now = new Date()
  const end = c.endDate ? new Date(c.endDate) : null
  const start = c.startDate ? new Date(c.startDate) : null
  if (end && end < now) return { label: 'Expired', style: dangerStyle }
  if (end) {
    const days = Math.ceil((end.getTime() - now.getTime()) / 86400000)
    if (days <= 3) return { label: `${days}d left`, style: warningStyle }
  }
  if (start && start > now) return { label: 'Upcoming', style: infoStyle }
  return { label: 'Active', style: successStyle }
}

function getProgress(c: Checklist) {
  const items = Array.isArray(c.items) ? c.items : [];
  if (items.length === 0) return 0
  return Math.round((items.filter(i => i.completed).length / items.length) * 100)
}

function getTotalEffort(c: Checklist) {
  const items = Array.isArray(c.items) ? c.items : [];
  return items.reduce((sum, i) => sum + (i.effortEstimate || 0), 0)
}

function getOverallPriority(c: Checklist): Priority {
  const items = Array.isArray(c.items) ? c.items : [];
  if (items.some(i => i.priority === 'high')) return 'high'
  if (items.some(i => i.priority === 'normal')) return 'normal'
  return 'low'
}

export type SortOption = 'newest' | 'name' | 'progress' | 'due-date'

interface Props {
  tab: ChecklistTab
  checklists: Checklist[]
  categories: ChecklistCategory[]
  filter: ChecklistFilter
  categoryFilter: number | null
  expandedId: number | null
  search: string
  sort: SortOption
  onTabChange: (tab: ChecklistTab) => void
  onSearchChange: (s: string) => void
  onSortChange: (s: SortOption) => void
  onFilterChange: (f: ChecklistFilter) => void
  onCategoryFilterChange: (id: number | null) => void
  onToggleExpand: (id: number) => void
  onEdit: (c: Checklist) => void
  onNew: () => void
  onDuplicate: (id: number) => void
  onDelete: (id: number) => void
  onArchive?: (id: number) => void
  onInstantiateTemplate?: (template: Checklist) => void
  onToggleItem: (checklistId: number, item: ChecklistItem) => void
  onAddItem: (checklistId: number, title: string, priority: Priority, parentId?: number | null) => void
  onUpdateItem: (checklistId: number, item: ChecklistItem, data: Partial<ChecklistItem>) => void
  onDeleteItem: (checklistId: number, itemId: number) => void
  onReorder: (checklistId: number, items: ChecklistItem[]) => void
  onCreateReminder: (checklistId: number, item: ChecklistItem) => void
}

const filterOptions: { value: ChecklistFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'no-dates', label: 'No dates' },
]

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
  { value: 'progress', label: 'Progress' },
  { value: 'due-date', label: 'Due date' },
]

// --- Undo Toast ---
function UndoToast({ message, onUndo, onClose }: { message: string; onUndo: () => void; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
      <div className="checklist-undo-toast flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border"
        style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
        <span className="material-symbols-outlined text-lg" style={{ color: 'var(--color-warning)' }}>delete</span>
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{message}</span>
        <button onClick={onUndo} className="px-3 py-1 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg">Undo</button>
        <button onClick={onClose} className="checklist-close-btn" style={{ color: 'var(--color-text-muted)' }}>
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  )
}

// --- Mini Dashboard ---
function MiniDashboard({ checklist }: { checklist: Checklist }) {
  const progress = getProgress(checklist)
  const effort = getTotalEffort(checklist)
  const priority = getOverallPriority(checklist)
  const prioConfig = priorityConfig[priority]

  return (
    <div className="checklist-mini-dashboard mb-3 px-4 py-2 rounded-lg border"
      style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {checklist.endDate && (
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="material-symbols-outlined text-xs align-middle mr-1">event</span>
              {new Date(checklist.endDate).toLocaleDateString()}
            </span>
          )}
          <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-current"
            style={{ color: prioConfig.color, background: 'var(--color-bg-surface)' }}>
            {priority} priority
          </span>
        </div>
        {effort > 0 && (
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Est. effort: {Math.floor(effort / 60)}h {effort % 60}m
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-surface-hover)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: checklist.color }} />
        </div>
        <span className="text-xs font-medium w-8 text-right" style={{ color: 'var(--color-text-secondary)' }}>{progress}%</span>
      </div>
    </div>
  )
}

// --- Inline Add Item ---
function InlineItemInput({ onAdd, checklistItems }: { onAdd: (title: string, priority: Priority, parentId?: number | null) => void; checklistItems: ChecklistItem[] }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')
  const [parentId, setParentId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim(), priority, parentId)
    setTitle('')
    setPriority('normal')
    setParentId(null)
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
      <input ref={inputRef} type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Add item..."
        className="checklist-inline-input flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }} />
      <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
        className="checklist-inline-select px-2 py-2 text-xs rounded-lg border focus:ring-2 focus:ring-primary"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}>
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
      </select>
      <select value={parentId ?? ''} onChange={e => setParentId(e.target.value ? parseInt(e.target.value) : null)}
        className="checklist-inline-select px-2 py-2 text-xs rounded-lg border focus:ring-2 focus:ring-primary"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}>
        <option value="">No parent</option>
        {checklistItems.map(item => (
          <option key={item.id} value={item.id}>{item.title.slice(0, 30)}</option>
        ))}
      </select>
      <button type="submit" disabled={!title.trim()}
        className="btn-neon px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
        Add
      </button>
    </form>
  )
}

// --- Expanded Items ---
function ExpandedItems({ checklist: c, onToggleItem, onUpdateItem, onDeleteItem, onAddItem, onReorder, onCreateReminder, mode }: {
  checklist: Checklist
  onToggleItem: (checklistId: number, item: ChecklistItem) => void
  onUpdateItem: (checklistId: number, item: ChecklistItem, data: Partial<ChecklistItem>) => void
  onDeleteItem: (checklistId: number, itemId: number) => void
  onAddItem: (checklistId: number, title: string, priority: Priority, parentId?: number | null) => void
  onReorder: (checklistId: number, items: ChecklistItem[]) => void
  onCreateReminder: (checklistId: number, item: ChecklistItem) => void
  mode: 'active' | 'template' | 'history'
}) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editEffort, setEditEffort] = useState<number | ''>('')
  const [editBlockedBy, setEditBlockedBy] = useState<number | ''>('')
  const [notesId, setNotesId] = useState<number | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [hideCompleted, setHideCompleted] = useState(false)
  const [undoItem, setUndoItem] = useState<{ item: ChecklistItem; timer: NodeJS.Timeout } | null>(null)
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  const itemsList = Array.isArray(c.items) ? c.items : []

  const buildTree = (items: ChecklistItem[], parentId: number | null = null, depth = 0): Array<{ item: ChecklistItem; depth: number }> => {
    const result: Array<{ item: ChecklistItem; depth: number }> = []
    items.filter(i => i.parentId === parentId).forEach(item => {
      result.push({ item, depth })
      result.push(...buildTree(items, item.id, depth + 1))
    })
    return result
  }

  const treeItems = buildTree(itemsList)

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null; dragOver.current = null; return
    }
    const visible = getVisibleItems()
    const [moved] = visible.splice(dragItem.current, 1)
    visible.splice(dragOver.current, 0, moved)
    const hidden = hideCompleted ? itemsList.filter(i => i.completed) : []
    const all = [...visible, ...hidden].map((item, i) => ({ ...item, position: i }))
    onReorder(c.id, all)
    dragItem.current = null; dragOver.current = null
  }

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id)
    setEditTitle(item.title)
    setEditEffort(item.effortEstimate || '')
    setEditBlockedBy(item.blockedByItemId || '')
  }
  const saveEdit = (item: ChecklistItem) => {
    const updates: Partial<ChecklistItem> = {}
    if (editTitle.trim() && editTitle !== item.title) updates.title = editTitle.trim()
    if (editEffort !== '') updates.effortEstimate = Number(editEffort)
    if (editBlockedBy !== '') updates.blockedByItemId = Number(editBlockedBy)
    if (Object.keys(updates).length > 0) onUpdateItem(c.id, item, updates)
    setEditingId(null)
  }

  const handleDeleteItem = (itemId: number) => {
    const item = itemsList.find(i => i.id === itemId)
    if (!item) return
    if (undoItem) { clearTimeout(undoItem.timer); onDeleteItem(c.id, undoItem.item.id) }
    const timer = setTimeout(() => { onDeleteItem(c.id, itemId); setUndoItem(null) }, 5000)
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

  const getVisibleItems = () => {
    let items = [...treeItems]
    if (undoItem) items = items.filter(i => i.item.id !== undoItem.item.id)
    if (hideCompleted) items = items.filter(i => !i.item.completed)
    return items.map(t => t.item)
  }

  const visibleItems = getVisibleItems()
  const completedCount = itemsList.filter(i => i.completed).length

  const isBlocked = (item: ChecklistItem) => {
    if (!item.blockedByItemId) return false
    const blocker = itemsList.find(i => i.id === item.blockedByItemId)
    return !!blocker && !blocker.completed
  }

  return (
    <div className="px-4 pb-4 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
      {completedCount > 0 && mode !== 'history' && (
        <div className="flex items-center justify-end mb-2">
          <button onClick={() => setHideCompleted(!hideCompleted)}
            className="checklist-hide-toggle flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="material-symbols-outlined text-xs">{hideCompleted ? 'visibility' : 'visibility_off'}</span>
            {hideCompleted ? `Show completed (${completedCount})` : 'Hide completed'}
          </button>
        </div>
      )}

      {visibleItems.length === 0 ? (
        <p className="text-sm text-center py-3" style={{ color: 'var(--color-text-muted)' }}>
          {hideCompleted ? 'All items completed!' : 'No items yet — add one below'}
        </p>
      ) : (
        <div className="space-y-1">
          {visibleItems.map((item, idx) => {
            const prio = priorityConfig[item.priority as Priority] || priorityConfig.normal
            const depth = treeItems.find(t => t.item.id === item.id)?.depth || 0
            const blocked = isBlocked(item)
            return (
              <div key={item.id}>
                <div draggable={mode !== 'history'} onDragStart={() => { dragItem.current = idx }}
                  onDragEnter={() => { dragOver.current = idx }} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}
                  className={`checklist-item-row flex items-center gap-2.5 py-1.5 group/item ${item.completed ? 'opacity-60' : ''} ${blocked ? 'opacity-50' : ''}`}
                  style={{ paddingLeft: `${depth * 20}px` }}>
                  {mode !== 'history' && (
                    <span className="material-symbols-outlined cursor-grab text-xs" style={{ color: 'var(--color-text-muted)' }}>drag_indicator</span>
                  )}
                  <button onClick={() => mode === 'active' && !blocked && onToggleItem(c.id, item)}
                    className={`checklist-item-checkbox w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${item.completed ? 'checklist-item-checkbox-checked bg-primary border-primary' : (blocked || mode !== 'active') ? 'cursor-not-allowed' : 'checklist-checkbox-unchecked'}`}
                    style={!item.completed ? { borderColor: 'var(--color-border-strong)' } : undefined}>
                    {item.completed && <span className="material-symbols-outlined text-white text-xs">check</span>}
                  </button>
                  {editingId === item.id && mode !== 'history' ? (
                    <div className="flex-1 flex gap-2">
                      <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(item); if (e.key === 'Escape') setEditingId(null) }}
                        className="checklist-item-input flex-1 text-sm px-1 py-0.5 bg-transparent border-b-2 border-primary focus:outline-none"
                        style={{ color: 'var(--color-text-primary)' }} />
                      <input type="number" value={editEffort} onChange={e => setEditEffort(e.target.value ? parseInt(e.target.value) : '')} placeholder="Min"
                        className="rf-input w-16 text-xs px-1 py-0.5 bg-transparent border-b focus:outline-none"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                      <select value={editBlockedBy} onChange={e => setEditBlockedBy(e.target.value ? parseInt(e.target.value) : '')}
                        className="todo-select text-xs px-1 py-0.5 bg-transparent border-b focus:outline-none"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
                        <option value="">No blocker</option>
                        {itemsList.filter(i => i.id !== item.id).map(i => (
                          <option key={i.id} value={i.id}>{i.title.slice(0, 20)}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span onDoubleClick={() => mode !== 'history' && startEdit(item)}
                      className={`flex-1 text-sm ${item.completed ? 'checklist-item-completed line-through' : blocked ? 'checklist-item-blocked' : ''}`}
                      style={{ color: item.completed || blocked ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                      {item.title}
                      {blocked && (
                        <span className="checklist-item-blocked-badge ml-2 text-xs inline-flex items-center gap-0.5" style={{ color: 'var(--color-warning)' }}>
                          <span className="material-symbols-outlined text-xs">lock</span>
                          Blocked
                        </span>
                      )}
                      {item.effortEstimate && (
                        <span className="ml-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>({item.effortEstimate}m)</span>
                      )}
                    </span>
                  )}
                  {mode !== 'history' && (
                    <>
                      <button onClick={() => { setNotesId(notesId === item.id ? null : item.id); setNotesValue(item.notes || '') }}
                        title={item.notes || 'Add notes'}
                        className={`todo-action-btn p-0.5 transition-opacity ${item.notes ? '' : 'opacity-0 group-hover/item:opacity-100'}`}
                        style={{ color: item.notes ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                        <span className="material-symbols-outlined text-xs">sticky_note_2</span>
                      </button>
                      <button onClick={() => {
                          const next: Record<string, Priority> = { normal: 'high', high: 'low', low: 'normal' }
                          onUpdateItem(c.id, item, { priority: next[item.priority] || 'normal' })
                        }} title={`Priority: ${item.priority}`}
                        className="material-symbols-outlined text-xs cursor-pointer hover:scale-125 transition-transform"
                        style={{ color: prio.color }}>{prio.icon}</button>
                      <button onClick={() => startEdit(item)}
                        className="todo-action-btn p-0.5 hover:text-primary opacity-0 group-hover/item:opacity-100 transition-opacity"
                        style={{ color: 'var(--color-text-muted)' }}>
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => onCreateReminder(c.id, item)} title="Set reminder"
                        className="todo-action-btn p-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity checklist-action-btn-reminder"
                        style={{ color: 'var(--color-text-muted)' }}>
                        <span className="material-symbols-outlined text-sm">notifications</span>
                      </button>
                      <button onClick={() => handleDeleteItem(item.id)}
                        className="todo-action-btn todo-action-btn-danger p-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity"
                        style={{ color: 'var(--color-text-muted)' }}>
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </>
                  )}
                </div>
                {/* Notes editor */}
                {notesId === item.id && mode !== 'history' && (
                  <div className="ml-10 mt-1 mb-2" style={{ marginLeft: `${depth * 20 + 40}px` }}>
                    <textarea value={notesValue} onChange={e => setNotesValue(e.target.value)} rows={2} placeholder="Add notes..."
                      className="checklist-notes-area w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }} />
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => { onUpdateItem(c.id, item, { notes: notesValue || null }); setNotesId(null) }}
                        className="btn-neon px-3 py-1 text-xs bg-primary text-white rounded-lg hover:bg-primary/90">Save</button>
                      <button onClick={() => setNotesId(null)}
                        className="btn-outline px-3 py-1 text-xs checklist-cancel-btn" style={{ color: 'var(--color-text-muted)' }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {mode !== 'history' && <InlineItemInput onAdd={(title, priority, parentId) => onAddItem(c.id, title, priority, parentId)} checklistItems={itemsList} />}

      {undoItem && <UndoToast message={`"${undoItem.item.title}" deleted`} onUndo={handleUndo} onClose={dismissUndo} />}
    </div>
  )
}

// --- Main Component ---
export default function ChecklistList({
  tab, checklists, categories, filter, categoryFilter, expandedId, search, sort,
  onTabChange, onSearchChange, onSortChange,
  onFilterChange, onCategoryFilterChange, onToggleExpand, onEdit, onNew, onDuplicate, onDelete,
  onArchive, onInstantiateTemplate,
  onToggleItem, onAddItem, onUpdateItem, onDeleteItem, onReorder, onCreateReminder,
}: Props) {
  const [undoChecklist, setUndoChecklist] = useState<{ checklist: Checklist; timer: NodeJS.Timeout } | null>(null)

  const handleDelete = (id: number) => {
    const cl = checklists.find(c => c.id === id)
    if (!cl) return
    if (undoChecklist) { clearTimeout(undoChecklist.timer); onDelete(undoChecklist.checklist.id) }
    const timer = setTimeout(() => { onDelete(id); setUndoChecklist(null) }, 5000)
    setUndoChecklist({ checklist: cl, timer })
  }

  const handleUndo = () => {
    if (!undoChecklist) return
    clearTimeout(undoChecklist.timer)
    setUndoChecklist(null)
  }

  const dismissUndo = useCallback(() => {
    if (!undoChecklist) return
    clearTimeout(undoChecklist.timer)
    onDelete(undoChecklist.checklist.id)
    setUndoChecklist(null)
  }, [undoChecklist, onDelete])

  let filtered = checklists.filter(c => {
    if (undoChecklist && c.id === undoChecklist.checklist.id) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter && c.categoryId !== categoryFilter) return false
    if (tab === 'templates') return true
    if (tab === 'history') return true
    if (filter === 'all') return true
    const status = getStatus(c).label
    if (filter === 'active') return status === 'Active' || status.includes('left') || status === 'Upcoming'
    if (filter === 'expired') return status === 'Expired'
    if (filter === 'no-dates') return status === 'No dates'
    return true
  })

  filtered = [...filtered].sort((a, b) => {
    if (sort === 'name') return a.title.localeCompare(b.title)
    if (sort === 'progress') return getProgress(b) - getProgress(a)
    if (sort === 'due-date') {
      const aEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity
      const bEnd = b.endDate ? new Date(b.endDate).getTime() : Infinity
      return aEnd - bEnd
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const tabLabels: { value: ChecklistTab; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'templates', label: 'Templates' },
    { value: 'history', label: 'History' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Checklists</h2>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>{checklists.length} checklists</p>
        </div>
        <button onClick={onNew} className="btn-neon flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium">
          <span className="material-symbols-outlined text-sm">add</span>
          New Checklist
        </button>
      </div>

      {/* Tabs */}
      <div className="checklist-tabs flex gap-1 border-b pb-1" style={{ borderColor: 'var(--color-border)' }}>
        {tabLabels.map(t => (
          <button key={t.value} onClick={() => onTabChange(t.value)}
            data-active={tab === t.value}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t.value ? 'text-primary border-b-2 border-primary bg-primary/5' : 'checklist-tab-inactive'}`}
            style={tab !== t.value ? { color: 'var(--color-text-muted)' } : undefined}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-text-muted)' }}>search</span>
        <input type="text" value={search} onChange={e => onSearchChange(e.target.value)} placeholder="Search checklists..."
          className="checklist-search w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }} />
      </div>

      {/* Filters + Sort */}
      {tab === 'active' && (
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map(f => (
            <button key={f.value} onClick={() => onFilterChange(f.value)}
              className={`checklist-filter-btn px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f.value ? 'checklist-filter-btn-active bg-primary text-white' : 'checklist-filter-btn-inactive'}`}
              style={filter !== f.value ? { background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-secondary)' } : undefined}>
              {f.label}
            </button>
          ))}
          {categories.length > 0 && (
            <select value={categoryFilter ?? ''} onChange={e => onCategoryFilterChange(e.target.value ? parseInt(e.target.value) : null)}
              className="checklist-select px-3 py-1.5 rounded-lg text-sm border-0 focus:ring-2 focus:ring-primary"
              style={{ background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-secondary)' }}>
              <option value="">All categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          )}
          <div className="ml-auto flex items-center gap-1">
            <span className="material-symbols-outlined text-xs" style={{ color: 'var(--color-text-muted)' }}>sort</span>
            <select value={sort} onChange={e => onSortChange(e.target.value as SortOption)}
              className="checklist-select px-2 py-1.5 rounded-lg text-sm border-0 focus:ring-2 focus:ring-primary"
              style={{ background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-secondary)' }}>
              {sortOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state text-center py-16 rounded-xl border border-dashed"
          style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)' }}>
          <span className="material-symbols-outlined text-5xl mb-4 block" style={{ color: 'var(--color-text-muted)' }}>fact_check</span>
          <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>{search ? 'No results' : tab === 'templates' ? 'No templates yet' : tab === 'history' ? 'No history yet' : 'No checklists yet'}</p>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>{search ? 'Try a different search' : tab === 'templates' ? 'Create a template to get started' : tab === 'history' ? 'Complete and archive checklists to see them here' : 'Create one to get started'}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => {
            const progress = getProgress(c)
            const status = getStatus(c)
            const isExpanded = expandedId === c.id
            const isTemplate = tab === 'templates'
            const isHistory = tab === 'history'
            return (
              <div key={c.id}
                className={`checklist-card rounded-xl border transition-all ${isExpanded ? 'checklist-card-expanded border-primary/40 shadow-sm' : ''}`}
                style={{ background: 'var(--color-bg-surface)', borderColor: isExpanded ? undefined : 'var(--color-border)' }}>
                <div className="p-4 cursor-pointer group" onClick={() => onToggleExpand(c.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-sm transition-transform" style={{ color: 'var(--color-text-muted)', transform: isExpanded ? 'rotate(90deg)' : '' }}>
                          chevron_right
                        </span>
                        {c.category && (
                          <span className="material-symbols-outlined text-sm" style={{ color: c.category.color }}>{c.category.icon}</span>
                        )}
                        <h3 className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{c.title}</h3>
                        {isTemplate && c.version && (
                          <span className="badge-version px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-secondary)' }}>
                            v{c.version}
                          </span>
                        )}
                        <span className="checklist-status-badge px-2 py-0.5 rounded-full text-xs font-medium" style={status.style}>{status.label}</span>
                      </div>
                      {c.description && <p className="text-sm truncate ml-6" style={{ color: 'var(--color-text-muted)' }}>{c.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      {isTemplate && onInstantiateTemplate && (
                        <button onClick={e => { e.stopPropagation(); onInstantiateTemplate(c) }} title="Create instance"
                          className="checklist-action-btn checklist-action-btn-green p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--color-text-muted)' }}>
                          <span className="material-symbols-outlined text-sm">play_arrow</span>
                        </button>
                      )}
                      {!isHistory && (
                        <button onClick={e => { e.stopPropagation(); onEdit(c) }} title="Edit"
                          className="checklist-action-btn p-1.5 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                          style={{ color: 'var(--color-text-muted)' }}>
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                      )}
                      {!isTemplate && !isHistory && (
                        <button onClick={e => { e.stopPropagation(); onDuplicate(c.id) }} title="Duplicate"
                          className="checklist-action-btn checklist-action-btn-copy p-1.5 hover:text-primary rounded-lg transition-colors"
                          style={{ color: 'var(--color-text-muted)' }}>
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                      )}
                      {!isTemplate && !isHistory && onArchive && (
                        <button onClick={e => { e.stopPropagation(); onArchive(c.id) }} title="Archive"
                          className="checklist-action-btn checklist-action-btn-amber p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--color-text-muted)' }}>
                          <span className="material-symbols-outlined text-sm">archive</span>
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); handleDelete(c.id) }} title="Delete"
                        className="checklist-action-btn checklist-action-btn-danger p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}>
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 ml-6">
                    <div className="checklist-progress-track flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-surface-hover)' }}>
                      <div className="checklist-progress-fill h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: c.color }} />
                    </div>
                    <span className="text-xs font-medium w-16 text-right" style={{ color: 'var(--color-text-muted)' }}>
                       {(() => {
                         const itemsList = Array.isArray(c.items) ? c.items : []
                         return `${itemsList.filter(i => i.completed).length}/${itemsList.length} (${progress}%)`
                       })()}
                    </span>
                  </div>
                  {/* History metrics */}
                  {isHistory && (c as any).metrics && (
                    <div className="mt-2 ml-6 flex gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <span>Items: {(c as any).metrics.totalItems}</span>
                      <span>Completed: {(c as any).metrics.completedItems}</span>
                      <span>Completion: {(c as any).metrics.completionPercentage}%</span>
                      {(c as any).metrics.totalEffort > 0 && <span>Effort: {Math.floor((c as any).metrics.totalEffort / 60)}h {(c as any).metrics.totalEffort % 60}m</span>}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <ExpandedItems checklist={c}
                    onToggleItem={onToggleItem} onUpdateItem={onUpdateItem}
                    onDeleteItem={onDeleteItem} onAddItem={onAddItem} onReorder={onReorder}
                    onCreateReminder={onCreateReminder}
                    mode={isHistory ? 'history' : isTemplate ? 'template' : 'active'}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {undoChecklist && <UndoToast message={`"${undoChecklist.checklist.title}" deleted`} onUndo={handleUndo} onClose={dismissUndo} />}
    </div>
  )
}
