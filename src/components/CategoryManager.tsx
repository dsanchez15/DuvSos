'use client'

import { useState } from 'react'
import { ChecklistCategory } from '@/types/checklist'

interface Props {
  categories: ChecklistCategory[]
  onAdd: (name: string, color: string, icon: string) => void
  onUpdate: (id: number, data: Partial<ChecklistCategory>) => void
  onDelete: (id: number) => void
  onClose: () => void
}

const presetColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
const presetIcons = ['folder', 'work', 'flight', 'home', 'school', 'fitness_center', 'shopping_cart', 'restaurant']

export default function CategoryManager({ categories, onAdd, onUpdate, onDelete, onClose }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [icon, setIcon] = useState('folder')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), color, icon)
    setName('')
    setColor('#3b82f6')
    setIcon('folder')
  }

  const startEdit = (cat: ChecklistCategory) => {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  const saveEdit = (id: number) => {
    if (editName.trim()) onUpdate(id, { name: editName.trim() })
    setEditingId(null)
  }

  return (
    <div className="delete-modal-overlay fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'var(--color-bg-overlay)' }} onClick={onClose}>
      <div className="category-modal rounded-2xl w-full max-w-md" style={{ background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Manage Categories</h3>
            <button onClick={onClose} className="cat-close-btn p-1" style={{ color: 'var(--color-text-muted)' }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Add form */}
          <form onSubmit={handleAdd} className="space-y-3 mb-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Category name..."
              className="cat-input w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', '--tw-placeholder-opacity': 1 } as React.CSSProperties} />
            <div className="flex gap-2 items-center">
              <span className="text-xs w-10" style={{ color: 'var(--color-text-muted)' }}>Color:</span>
              {presetColors.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full ${color === c ? 'ring-2 ring-offset-1 ring-primary' : ''}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs w-10" style={{ color: 'var(--color-text-muted)' }}>Icon:</span>
              {presetIcons.map(i => (
                <button key={i} type="button" onClick={() => setIcon(i)}
                  className={`p-1 rounded-lg text-sm ${icon === i ? 'bg-primary/10 text-primary' : 'cat-icon-btn'}`}
                  style={icon !== i ? { color: 'var(--color-text-muted)' } : {}}>
                  <span className="material-symbols-outlined text-sm">{i}</span>
                </button>
              ))}
            </div>
            <button type="submit" disabled={!name.trim()}
              className="btn-neon w-full px-4 py-2 bg-primary rounded-xl hover:bg-primary/90 font-medium text-sm disabled:opacity-50" style={{ color: 'var(--color-text-inverse)' }}>
              Add Category
            </button>
          </form>

          {/* List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-center text-sm py-4" style={{ color: 'var(--color-text-muted)' }}>No categories yet</p>
            ) : categories.map(cat => (
              <div key={cat.id} className="cat-row flex items-center gap-2 p-2 rounded-lg cat-row-hover group">
                <span className="material-symbols-outlined text-sm" style={{ color: cat.color }}>{cat.icon}</span>
                {editingId === cat.id ? (
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                    onBlur={() => saveEdit(cat.id)} onKeyDown={e => e.key === 'Enter' && saveEdit(cat.id)} autoFocus
                    className="flex-1 px-2 py-1 text-sm rounded border border-primary focus:outline-none" style={{ background: 'var(--color-bg-input)' }} />
                ) : (
                  <span className="flex-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{cat.name}</span>
                )}
                <button onClick={() => startEdit(cat)} className="todo-action-btn p-1 opacity-0 group-hover:opacity-100" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button onClick={() => onDelete(cat.id)} className="todo-action-btn todo-action-btn-danger p-1 opacity-0 group-hover:opacity-100" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
