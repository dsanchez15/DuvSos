'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Todo, Category, Priority } from '@/types/todo'
import { useAppTranslation } from '@/components/LanguageProvider'

interface TodoEditModalProps {
  todo: Todo
  categories: Category[]
  onSave: (data: {
    id: number
    title: string
    description: string
    priority: Priority
    dueDate: string
    dueTime: string
    effortMinutes: number
    categoryId: number | null
  }) => Promise<void>
  onClose: () => void
  apiError: string
}

export default function TodoEditModal({
  todo,
  categories,
  onSave,
  onClose,
  apiError,
}: TodoEditModalProps) {
  const { t } = useAppTranslation()
  const modalRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description || '')
  const [priority, setPriority] = useState<Priority>(todo.priority)
  const [dueDate, setDueDate] = useState(todo.dueDate ? todo.dueDate.split('T')[0] : '')
  const [dueTime, setDueTime] = useState(todo.dueTime || '')
  const [effort, setEffort] = useState(todo.effortMinutes ? (todo.effortMinutes / 60).toString() : '')
  const [category, setCategory] = useState(todo.categoryId ? todo.categoryId.toString() : '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleSave = useCallback(async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      const effortMinutes = effort ? parseFloat(effort) * 60 : 0
      const cat = categories.find((c) => c.id === (category ? parseInt(category) : undefined))
      await onSave({
        id: todo.id,
        title: title.trim(),
        description,
        priority,
        dueDate,
        dueTime,
        effortMinutes: Math.round(effortMinutes),
        categoryId: cat?.id ?? null,
      })
    } finally {
      setSaving(false)
    }
  }, [title, description, priority, dueDate, dueTime, effort, category, categories, todo.id, onSave, saving])

  return (
    <div
      className="delete-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--color-bg-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div
        ref={modalRef}
        className="todo-edit-modal todo-section-card p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h3 id="edit-modal-title" className="text-lg font-bold todo-text-primary">
          {t('todos.editTitle')}
        </h3>

        {apiError && (
          <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{apiError}</p>
        )}

        <div className="space-y-3">
          <div>
            <label htmlFor="edit-title" className="todo-label">{t('todos.form.title')}</label>
            <input
              id="edit-title"
              ref={firstInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="modal-input todo-input w-full py-2"
            />
          </div>
          <div>
            <label htmlFor="edit-description" className="todo-label">{t('todos.form.description')}</label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="modal-input todo-input w-full py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-priority" className="todo-label">{t('todos.form.priority')}</label>
              <select
                id="edit-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="modal-select todo-input-sm w-full"
              >
                <option value="low">{t('todos.priorities.low')}</option>
                <option value="normal">{t('todos.priorities.normal')}</option>
                <option value="high">{t('todos.priorities.high')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="edit-category" className="todo-label">{t('todos.form.category')}</label>
              <select
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="modal-select todo-input-sm w-full"
              >
                <option value="">{t('todos.noCategory')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-due-date" className="todo-label">{t('todos.form.dueDate')}</label>
              <input
                id="edit-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="modal-input todo-input-sm w-full"
              />
            </div>
            <div>
              <label htmlFor="edit-due-time" className="todo-label">{t('todos.form.dueTime')}</label>
              <input
                id="edit-due-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="modal-input todo-input-sm w-full"
              />
            </div>
          </div>
          <div>
            <label htmlFor="edit-effort" className="todo-label">{t('todos.form.effort')}</label>
            <input
              id="edit-effort"
              type="number"
              value={effort}
              onChange={(e) => setEffort(e.target.value)}
              min="0"
              step="0.5"
              className="modal-input todo-input-sm w-full"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 todo-text-secondary"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="todo-btn-primary"
          >
            {saving ? '...' : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}