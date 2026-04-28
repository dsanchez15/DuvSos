'use client'

import { useState, useEffect } from 'react'
import { Checklist, ChecklistCategory, ChecklistFormData } from '@/types/checklist'

interface Props {
  checklist?: Checklist | null
  categories: ChecklistCategory[]
  onSave: (data: ChecklistFormData) => void
  onCancel: () => void
  onManageCategories: () => void
}

const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

export default function ChecklistForm({ checklist, categories, onSave, onCancel, onManageCategories }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [isTemplate, setIsTemplate] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState('')

  useEffect(() => {
    if (checklist) {
      setTitle(checklist.title)
      setDescription(checklist.description || '')
      setColor(checklist.color)
      setStartDate(checklist.startDate ? new Date(checklist.startDate).toISOString().split('T')[0] : '')
      setEndDate(checklist.endDate ? new Date(checklist.endDate).toISOString().split('T')[0] : '')
      setCategoryId(checklist.categoryId || null)
      setIsTemplate(checklist.isTemplate || false)
      setRecurrencePattern(checklist.recurrencePattern || '')
    }
  }, [checklist])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      color,
      startDate: startDate || null,
      endDate: endDate || null,
      categoryId,
      isTemplate,
      recurrencePattern: recurrencePattern || null,
    })
  }

  return (
    <div className="delete-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="checklist-form-modal rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}
        style={{ background: 'var(--color-bg-surface)' }}>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {checklist ? 'Edit Checklist' : 'New Checklist'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} autoFocus required
                className="form-input w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }} />
            </div>
            <div>
              <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="form-input w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }} />
            </div>
            <div>
              <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Color</label>
              <div className="flex gap-2">
                {colors.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="form-input w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }} />
              </div>
              <div>
                <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="form-input w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="rf-label block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Category</label>
                <button type="button" onClick={onManageCategories} className="text-xs text-primary hover:underline">Manage</button>
              </div>
              <select value={categoryId ?? ''} onChange={e => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                className="form-select w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}>
                <option value="">No category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="rf-label flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isTemplate} onChange={e => setIsTemplate(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary" style={{ borderColor: 'var(--color-border)' }} />
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Save as template</span>
              </label>
            </div>
            {isTemplate && (
              <div>
                <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Recurrence Pattern</label>
                <select value={recurrencePattern} onChange={e => setRecurrencePattern(e.target.value)}
                  className="form-select w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}>
                  <option value="">None</option>
                  <option value="EVERY_MONDAY">Every Monday</option>
                  <option value="EVERY_FRIDAY">Every Friday</option>
                  <option value="FIRST_FRIDAY_OF_MONTH">First Friday of Month</option>
                  <option value="FIRST_MONDAY_OF_MONTH">First Monday of Month</option>
                </select>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onCancel}
                className="btn-outline checklist-form-cancel flex-1 px-4 py-2.5 rounded-xl border font-medium"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                Cancel
              </button>
              <button type="submit" disabled={!title.trim()}
                className="btn-neon flex-1 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 font-medium disabled:opacity-50">
                {checklist ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
