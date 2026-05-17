'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'

interface Milestone {
  id: number
  title: string
  description?: string
  date: string
  color: string
  items?: { itemModule: string; itemId: number }[]
}

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Milestone | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [color, setColor] = useState('#f59e0b')
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])

  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await fetch('/api/milestones')
      if (res.ok) setMilestones(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMilestones() }, [fetchMilestones])

  const fetchSuggestions = async (milestone: Milestone) => {
    try {
      const res = await fetch(`/api/milestones/suggestions?milestoneId=${milestone.id}`)
      if (res.ok) setSuggestions(await res.json())
    } catch (err) { console.error(err) }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date) return

    const data = { title: title.trim(), description: description || null, date, color }
    if (editing) {
      await fetch(`/api/milestones/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    } else {
      await fetch('/api/milestones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    }
    setShowForm(false)
    setEditing(null)
    setTitle(''); setDescription(''); setDate(''); setColor('#f59e0b')
    fetchMilestones()
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/milestones/${id}`, { method: 'DELETE' })
    fetchMilestones()
  }

  const addItem = async (milestoneId: number, itemModule: string, itemId: number) => {
    await fetch(`/api/milestones/${milestoneId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemModule, itemId }),
    })
    fetchMilestones()
    if (selectedMilestone?.id === milestoneId) {
      fetchSuggestions({ ...selectedMilestone, items: [...(selectedMilestone.items || []), { itemModule, itemId }] })
    }
  }

  const openDetail = async (m: Milestone) => {
    setSelectedMilestone(m)
    await fetchSuggestions(m)
  }

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div></AppLayout>
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Milestones</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{milestones.length} milestones</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setTitle(''); setDescription(''); setDate(''); setColor('#f59e0b') }}
            className="btn-neon flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-[8px] hover:bg-primary/90 font-medium">
            <span className="material-symbols-outlined text-sm">add</span>
            New Milestone
          </button>
        </div>

        {milestones.length === 0 ? (
          <div className="empty-state text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-[8px] border border-dashed border-slate-300 dark:border-slate-700">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-4 block">flag</span>
            <p className="text-slate-500 dark:text-slate-400 text-lg">No milestones yet</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {milestones.map(m => (
              <div key={m.id} className="dashboard-card bg-white dark:bg-slate-800 rounded-[8px] border border-slate-200 dark:border-slate-700 p-4 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => openDetail(m)}>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{m.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(m.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      {m.description && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{m.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(m); setTitle(m.title); setDescription(m.description || ''); setDate(m.date.split('T')[0]); setColor(m.color); setShowForm(true) }}
                      className="todo-action-btn p-1.5 text-slate-400 hover:text-primary rounded-[8px]">
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button onClick={() => handleDelete(m.id)}
                      className="todo-action-btn todo-action-btn-danger p-1.5 text-slate-400 hover:text-red-500 rounded-[8px]">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail panel with suggestions */}
        {selectedMilestone && (
          <div className="dashboard-card bg-white dark:bg-slate-800 rounded-[8px] border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">{selectedMilestone.title} — Suggestions</h3>
              <button onClick={() => setSelectedMilestone(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            {suggestions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No suggestions available</p>
            ) : (
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-[8px]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{s.module}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{s.title}</span>
                      <span className="text-xs text-slate-400">{s.reason}</span>
                    </div>
                    <button onClick={() => addItem(selectedMilestone.id, s.module, s.id)}
                      className="px-2 py-1 text-xs bg-primary text-white rounded-[8px] hover:bg-primary/90">Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form modal */}
        {showForm && (
          <div className="delete-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
            <div className="dashboard-card bg-white dark:bg-slate-800 rounded-[8px] w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{editing ? 'Edit Milestone' : 'New Milestone'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="rf-label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} autoFocus required
                      className="form-input w-full px-4 py-2.5 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                  </div>
                  <div>
                    <label className="rf-label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                      className="form-input w-full px-4 py-2.5 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="rf-label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                        className="form-input w-full px-4 py-2.5 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                    </div>
                    <div>
                      <label className="rf-label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color</label>
                      <div className="flex gap-2">
                        {colors.map(c => (
                          <button key={c} type="button" onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="btn-outline flex-1 px-4 py-2.5 rounded-[8px] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">Cancel</button>
                    <button type="submit" disabled={!title.trim() || !date}
                      className="btn-neon flex-1 px-4 py-2.5 bg-primary text-white rounded-[8px] hover:bg-primary/90 font-medium disabled:opacity-50">{editing ? 'Save' : 'Create'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
