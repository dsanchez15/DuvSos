'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { t } from '@/lib/i18n'
import { useAppTranslation } from '@/components/LanguageProvider'
import { Reminder, ReminderPriority } from '@/types/reminder'

const priorityConfig: Record<ReminderPriority, { icon: string; class: string; bg: string }> = {
  high: { icon: 'arrow_upward', class: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  normal: { icon: 'remove', class: 'reminder-prio-normal-icon', bg: '' },
  low: { icon: 'arrow_downward', class: 'text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
}

function formatDate(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diff = Math.ceil((date.getTime() - now.getTime()) / 86400000)
  const formatted = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  if (diff < 0) return { text: t('reminders.date.overdue', { date: formatted }), class: 'text-red-500 font-medium' }
  if (diff === 0) return { text: t('reminders.date.today'), class: 'text-amber-600 font-medium' }
  if (diff === 1) return { text: t('reminders.date.tomorrow'), class: 'text-amber-500' }
  if (diff <= 3) return { text: t('reminders.date.daysUntil', { date: formatted, count: diff }), class: 'text-amber-500' }
  return { text: formatted, class: 'reminder-date-default' }
}

export default function RemindersPage() {
  const { t } = useAppTranslation()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')
  const [conflictWarning, setConflictWarning] = useState<{ date: string; conflicts: any[] } | null>(null)

  // Basic fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<ReminderPriority>('normal')

  // Advanced fields
  const [sourceModule, setSourceModule] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [lifecycleStart, setLifecycleStart] = useState('')
  const [lifecycleEnd, setLifecycleEnd] = useState('')

  // Recurrence
  const [frequency, setFrequency] = useState<'once' | 'daily' | 'weekly' | 'monthly' | 'annual'>('once')
  const [interval, setInterval] = useState(1)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [dayOfMonth, setDayOfMonth] = useState('')
  const [monthOfYear, setMonthOfYear] = useState('')
  const [recurrenceEnd, setRecurrenceEnd] = useState('')

  // Exceptions
  const [exceptions, setExceptions] = useState<{ date: string; reason: string }[]>([])
  const [newExceptionDate, setNewExceptionDate] = useState('')
  const [newExceptionReason, setNewExceptionReason] = useState('')

  // Blockers
  const [blockers, setBlockers] = useState<{ blockerModule: string; blockerId: string }[]>([])
  const [newBlockerModule, setNewBlockerModule] = useState('')
  const [newBlockerId, setNewBlockerId] = useState('')

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/reminders')
      if (res.ok) setReminders(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchReminders() }, [fetchReminders])

  const api = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
    if (!res.ok) throw new Error('API error')
    return res.json()
  }

  const resetForm = () => {
    setTitle(''); setDescription(''); setDueDate(''); setPriority('normal')
    setSourceModule(''); setSourceId(''); setLifecycleStart(''); setLifecycleEnd('')
    setFrequency('once'); setInterval(1); setDaysOfWeek([]); setDayOfMonth(''); setMonthOfYear(''); setRecurrenceEnd('')
    setExceptions([]); setNewExceptionDate(''); setNewExceptionReason('')
    setBlockers([]); setNewBlockerModule(''); setNewBlockerId('')
    setConflictWarning(null)
  }

  const openNew = () => { resetForm(); setEditing(null); setShowForm(true) }

  const openEdit = async (r: Reminder) => {
    setEditing(r)
    setTitle(r.title)
    setDescription(r.description || '')
    setDueDate(new Date(r.dueDate).toISOString().split('T')[0])
    setPriority(r.priority as ReminderPriority)
    setSourceModule(r.sourceModule || '')
    setSourceId(r.sourceId?.toString() || '')
    setLifecycleStart(r.lifecycleStartDate ? new Date(r.lifecycleStartDate).toISOString().split('T')[0] : '')
    setLifecycleEnd(r.lifecycleEndDate ? new Date(r.lifecycleEndDate).toISOString().split('T')[0] : '')

    // Fetch full detail for recurrence/exceptions/blockers
    const detail = await fetch(`/api/reminders/${r.id}/detail`).then(res => res.ok ? res.json() : null)
    if (detail) {
      if (detail.recurrenceRule) {
        setFrequency(detail.recurrenceRule.frequency as any)
        setInterval(detail.recurrenceRule.interval)
        setDaysOfWeek(detail.recurrenceRule.daysOfWeek || [])
        setDayOfMonth(detail.recurrenceRule.dayOfMonth?.toString() || '')
        setMonthOfYear(detail.recurrenceRule.monthOfYear?.toString() || '')
        setRecurrenceEnd(detail.recurrenceRule.endDate ? new Date(detail.recurrenceRule.endDate).toISOString().split('T')[0] : '')
      }
      setExceptions(detail.exceptions.map((e: any) => ({ date: new Date(e.exceptionDate).toISOString().split('T')[0], reason: e.reason || '' })))
      setBlockers(detail.blockers.map((b: any) => ({ blockerModule: b.blockerModule, blockerId: b.blockerId.toString() })))
    }
    setShowForm(true)
  }

  const checkConflicts = async () => {
    if (!dueDate) return
    try {
      const res = await fetch('/api/reminders/conflict-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dueDate }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.hasConflict) setConflictWarning(data)
        else setConflictWarning(null)
      }
    } catch (err) { console.error(err) }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !dueDate) return

    const data: any = {
      title: title.trim(),
      description: description.trim() || null,
      dueDate,
      priority,
      sourceModule: sourceModule || null,
      sourceId: sourceId ? parseInt(sourceId) : null,
      lifecycleStartDate: lifecycleStart || null,
      lifecycleEndDate: lifecycleEnd || null,
      recurrence: frequency !== 'once' ? {
        frequency,
        interval,
        daysOfWeek,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : null,
        monthOfYear: monthOfYear ? parseInt(monthOfYear) : null,
        startDate: dueDate,
        endDate: recurrenceEnd || null,
      } : undefined,
      blockers: blockers.map(b => ({ blockerModule: b.blockerModule, blockerId: parseInt(b.blockerId) })),
    }

    if (editing) {
      await api(`/api/reminders/${editing.id}`, 'PUT', data)
      // Update exceptions
      for (const exc of exceptions) {
        await api(`/api/reminders/${editing.id}/exceptions`, 'POST', { exceptionDate: exc.date, reason: exc.reason })
      }
    } else {
      await api('/api/reminders', 'POST', data)
    }

    setShowForm(false)
    resetForm()
    fetchReminders()
  }

  const handleToggle = async (r: Reminder) => {
    await api(`/api/reminders/${r.id}`, 'PUT', { completed: !r.completed })
    setReminders(prev => prev.map(x => x.id === r.id ? { ...x, completed: !x.completed } : x))
  }

  const handleDelete = async (id: number) => {
    await api(`/api/reminders/${id}`, 'DELETE')
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  const addException = () => {
    if (!newExceptionDate) return
    setExceptions(prev => [...prev, { date: newExceptionDate, reason: newExceptionReason }])
    setNewExceptionDate(''); setNewExceptionReason('')
  }

  const removeException = (idx: number) => {
    setExceptions(prev => prev.filter((_, i) => i !== idx))
  }

  const addBlocker = () => {
    if (!newBlockerModule || !newBlockerId) return
    setBlockers(prev => [...prev, { blockerModule: newBlockerModule, blockerId: newBlockerId }])
    setNewBlockerModule(''); setNewBlockerId('')
  }

  const removeBlocker = (idx: number) => {
    setBlockers(prev => prev.filter((_, i) => i !== idx))
  }

  const filtered = reminders.filter(r => {
    if (filter === 'pending') return !r.completed
    if (filter === 'completed') return r.completed
    return true
  })

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div></AppLayout>
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('reminders.title')}</h2>
            <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {t('reminders.subtitle', { pending: reminders.filter(r => !r.completed).length, completed: reminders.filter(r => r.completed).length })}
            </p>
          </div>
          <button onClick={openNew} className="btn-neon flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium">
            <span className="material-symbols-outlined text-sm">add</span>
            {t('reminders.newReminder')}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['pending', 'all', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`reminder-filter-btn px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'reminder-filter-btn-active bg-primary text-white' : 'reminder-filter-btn-inactive'}`}
              style={filter === f ? undefined : { background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)' }}>
              {t(`reminders.filters.${f}`)}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="empty-state text-center py-16 rounded-xl border border-dashed" style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)' }}>
            <span className="material-symbols-outlined text-5xl mb-4 block" style={{ color: 'var(--color-text-muted)' }}>notifications_active</span>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.noReminders')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(r => {
              const prio = priorityConfig[r.priority as ReminderPriority] || priorityConfig.normal
              const due = formatDate(r.dueDate)
              return (
                <div key={r.id} className={`reminder-card p-4 rounded-xl border group ${r.completed ? 'reminder-card-completed opacity-60' : ''} ${prio.bg}`} style={{ background: prio.bg ? undefined : 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleToggle(r)}
                      className={`reminder-checkbox w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${r.completed ? 'reminder-checkbox-checked bg-green-500 border-green-500' : 'hover:border-green-500'}`}
                      style={r.completed ? undefined : { borderColor: 'var(--color-border)' }}>
                      {r.completed && <span className="material-symbols-outlined text-white text-xs">check</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${r.completed ? 'line-through' : ''}`} style={{ color: r.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>{r.title}</span>
                        <span className={`material-symbols-outlined text-xs ${prio.class}`}>{prio.icon}</span>
                        {r.sourceModule && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize" style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-muted)' }}>{r.sourceModule}</span>
                        )}
                      </div>
                      {r.description && <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>{r.description}</p>}
                      <p className={`text-xs mt-0.5 ${due.class}`}>
                        <span className="material-symbols-outlined text-xs align-middle mr-0.5">schedule</span>
                        {due.text}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(r)} className="todo-action-btn p-1.5 rounded-lg hover:bg-primary/10" style={{ color: 'var(--color-text-muted)' }}>
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="todo-action-btn todo-action-btn-danger p-1.5 rounded-lg" style={{ color: 'var(--color-text-muted)' }}>
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="delete-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="reminder-modal rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>{editing ? t('reminders.form.editTitle') : t('reminders.form.newTitle')}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                {/* Basic */}
                <div>
                  <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.title')}</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} autoFocus required
                    className="form-input w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }} />
                </div>
                <div>
                  <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.description')}</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                    className="form-input w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary resize-none" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.dueDate')}</label>
                    <input type="date" value={dueDate} onChange={e => { setDueDate(e.target.value); setConflictWarning(null) }} onBlur={checkConflicts} required
                      className="form-input w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }} />
                  </div>
                  <div>
                    <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.priority')}</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as ReminderPriority)}
                      className="form-select w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}>
                      <option value="low">{t('reminders.form.low')}</option>
                      <option value="normal">{t('reminders.form.normal')}</option>
                      <option value="high">{t('reminders.form.high')}</option>
                    </select>
                  </div>
                </div>

                {/* Conflict warning */}
                {conflictWarning && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500">warning</span>
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{t('reminders.form.conflictsOn', { count: conflictWarning.conflicts.length, date: conflictWarning.date })}</span>
                    </div>
                    <ul className="mt-1 ml-6 text-xs text-amber-600 dark:text-amber-400 list-disc">
                      {conflictWarning.conflicts.slice(0, 3).map((c, i) => (
                        <li key={i}>{c.title} ({c.module})</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Source Linking */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.sourceModule')}</label>
                    <select value={sourceModule} onChange={e => setSourceModule(e.target.value)}
                      className="form-select w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}>
                      <option value="">{t('reminders.form.moduleNone')}</option>
                      <option value="habit">{t('reminders.form.moduleHabit')}</option>
                      <option value="checklist">{t('reminders.form.moduleChecklist')}</option>
                      <option value="todo">{t('reminders.form.moduleTodo')}</option>
                      <option value="milestone">{t('reminders.form.moduleMilestone')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.sourceId')}</label>
                    <input type="number" value={sourceId} onChange={e => setSourceId(e.target.value)}
                      className="form-input w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }} />
                  </div>
                </div>

                {/* Lifecycle */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.lifecycleStart')}</label>
                    <input type="date" value={lifecycleStart} onChange={e => setLifecycleStart(e.target.value)}
                      className="form-input w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }} />
                  </div>
                  <div>
                    <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.lifecycleEnd')}</label>
                    <input type="date" value={lifecycleEnd} onChange={e => setLifecycleEnd(e.target.value)}
                      className="form-input w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }} />
                  </div>
                </div>

                {/* Recurrence */}
                <div>
                  <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.recurrence')}</label>
                  <select value={frequency} onChange={e => setFrequency(e.target.value as any)}
                    className="form-select w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}>
                    <option value="once">{t('reminders.form.once')}</option>
                    <option value="daily">{t('reminders.form.daily')}</option>
                    <option value="weekly">{t('reminders.form.weekly')}</option>
                    <option value="monthly">{t('reminders.form.monthly')}</option>
                    <option value="annual">{t('reminders.form.annual')}</option>
                  </select>
                </div>

                {frequency !== 'once' && (
                  <div className="space-y-3 p-3 rounded-xl" style={{ background: 'var(--color-bg-input)' }}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.interval')}</label>
                        <input type="number" min={1} value={interval} onChange={e => setInterval(parseInt(e.target.value) || 1)}
                          className="form-input w-full px-4 py-2 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }} />
                      </div>
                      <div>
                        <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.endDate')}</label>
                        <input type="date" value={recurrenceEnd} onChange={e => setRecurrenceEnd(e.target.value)}
                          className="form-input w-full px-4 py-2 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }} />
                      </div>
                    </div>

                    {frequency === 'weekly' && (
                      <div>
                        <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.daysOfWeek')}</label>
                        <div className="flex gap-1">
                          {['S','M','T','W','T','F','S'].map((d, i) => (
                            <button key={i} type="button" onClick={() => toggleDayOfWeek(i)}
                              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${daysOfWeek.includes(i) ? 'bg-primary text-white' : 'border'}`}
                              style={daysOfWeek.includes(i) ? undefined : { background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {frequency === 'monthly' && (
                      <div>
                        <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.dayOfMonth')}</label>
                        <input type="number" min={1} max={31} value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)}
                          className="form-input w-full px-4 py-2 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }} />
                      </div>
                    )}

                    {frequency === 'annual' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.month')}</label>
                          <input type="number" min={1} max={12} value={monthOfYear} onChange={e => setMonthOfYear(e.target.value)}
                            className="form-input w-full px-4 py-2 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }} />
                        </div>
                        <div>
                          <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.day')}</label>
                          <input type="number" min={1} max={31} value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)}
                            className="form-input w-full px-4 py-2 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Exceptions */}
                <div>
                  <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.exceptions')}</label>
                  <div className="flex gap-2 mb-2">
                    <input type="date" value={newExceptionDate} onChange={e => setNewExceptionDate(e.target.value)}
                      className="form-input flex-1 px-3 py-2 rounded-xl border text-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }} />
                    <input type="text" value={newExceptionReason} onChange={e => setNewExceptionReason(e.target.value)} placeholder={t('reminders.form.reason')}
                      className="form-input flex-1 px-3 py-2 rounded-xl border text-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }} />
                    <button type="button" onClick={addException}
                      className="px-3 py-2 rounded-xl text-sm font-medium reminder-add-btn" style={{ background: 'var(--color-bg-input)' }}>{t('reminders.form.add')}</button>
                  </div>
                  {exceptions.length > 0 && (
                    <div className="space-y-1">
                      {exceptions.map((exc, i) => (
                        <div key={i} className="flex items-center justify-between text-sm px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-bg-input)' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>{exc.date} {exc.reason && `— ${exc.reason}`}</span>
                          <button type="button" onClick={() => removeException(i)} className="reminder-remove-btn" style={{ color: 'var(--color-text-muted)' }}>
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Blockers */}
                <div>
                  <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('reminders.form.blockers')}</label>
                  <div className="flex gap-2 mb-2">
                    <select value={newBlockerModule} onChange={e => setNewBlockerModule(e.target.value)}
                      className="form-select px-3 py-2 rounded-xl border text-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}>
                      <option value="">{t('reminders.form.module')}</option>
                      <option value="habit">{t('reminders.form.moduleHabit')}</option>
                      <option value="checklist">{t('reminders.form.moduleChecklist')}</option>
                      <option value="todo">{t('reminders.form.moduleTodo')}</option>
                      <option value="reminder">{t('reminders.form.moduleMilestone')}</option>
                    </select>
                    <input type="number" value={newBlockerId} onChange={e => setNewBlockerId(e.target.value)} placeholder={t('reminders.form.id')}
                      className="form-input flex-1 px-3 py-2 rounded-xl border text-sm" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }} />
                    <button type="button" onClick={addBlocker}
                      className="px-3 py-2 rounded-xl text-sm font-medium reminder-add-btn" style={{ background: 'var(--color-bg-input)' }}>{t('reminders.form.add')}</button>
                  </div>
                  {blockers.length > 0 && (
                    <div className="space-y-1">
                      {blockers.map((b, i) => (
                        <div key={i} className="flex items-center justify-between text-sm px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-bg-input)' }}>
                          <span className="capitalize" style={{ color: 'var(--color-text-secondary)' }}>{b.blockerModule} #{b.blockerId}</span>
                          <button type="button" onClick={() => removeBlocker(i)} className="reminder-remove-btn" style={{ color: 'var(--color-text-muted)' }}>
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); resetForm() }}
                    className="btn-outline flex-1 px-4 py-2.5 rounded-xl border font-medium reminder-cancel-btn" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    {t('common.cancel')}
                  </button>
                  <button type="submit" disabled={!title.trim() || !dueDate}
                    className="btn-neon flex-1 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 font-medium disabled:opacity-50">
                    {editing ? t('common.save') : t('common.create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
