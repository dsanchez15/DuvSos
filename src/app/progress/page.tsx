'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import WeekCalendar from '@/components/WeekCalendar'
import { DailyProgress, WeeklyCheckIn, Goal, Phase } from '@/types/goal'
import { t, getLanguage } from '@/lib/i18n'

type Language = 'en' | 'es';
type EntryType = 'activity' | 'checkin' | null;

export default function ProgressPage() {
  const [entries, setEntries] = useState<DailyProgress[]>([])
  const [checkins, setCheckins] = useState<WeeklyCheckIn[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [lang] = useState<Language>(getLanguage())
  const [currentWeek, setCurrentWeek] = useState(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  })

  // Modal state
  const [entryType, setEntryType] = useState<EntryType>(null)

  // Activity form
  const [activityForm, setActivityForm] = useState({
    date: new Date().toISOString().split('T')[0],
    goalId: '',
    phaseId: '',
    startTime: '',
    durationHours: '',
    durationMinutes: '',
    notes: '',
  })

  // Check-in form
  const [checkinForm, setCheckinForm] = useState({
    weekStartDate: '',
    fatigueLevel: 3,
    deviations: '',
    adjustmentNotes: '',
  })

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const end = new Date(currentWeek)
      end.setDate(end.getDate() + 6)

      const [entriesRes, goalsRes, phasesRes, checkinsRes] = await Promise.all([
        fetch(`/api/progress/daily?startDate=${currentWeek.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`),
        fetch('/api/goals?status=ACTIVE'),
        fetch('/api/phases'),
        fetch('/api/checkin'),
      ])

      if (entriesRes.ok) {
        const data = await entriesRes.json()
        setEntries(data.entries)
      }
      if (goalsRes.ok) {
        const data = await goalsRes.json()
        setGoals(data.goals)
      }
      if (phasesRes.ok) {
        const data = await phasesRes.json()
        setPhases(data.phases)
      }
      if (checkinsRes.ok) {
        const data = await checkinsRes.json()
        setCheckins(data.checkins)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentWeek])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!activityForm.date || !activityForm.goalId) {
      setFormError(lang === 'es' ? 'Fecha y objetivo son obligatorios' : 'Date and goal are required')
      return
    }

    const hours = parseFloat(activityForm.durationHours || '0')
    const minutes = parseFloat(activityForm.durationMinutes || '0')
    const totalHours = hours + minutes / 60

    setSaving(true)
    try {
      const res = await fetch('/api/progress/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: activityForm.date,
          goalId: activityForm.goalId,
          plannedTime: activityForm.startTime || null,
          actualTime: activityForm.startTime || null,
          workHours: totalHours,
          notes: activityForm.notes.trim() || null,
        }),
      })

      if (!res.ok) throw new Error('Error')

      setActivityForm({
        date: new Date().toISOString().split('T')[0],
        goalId: '',
        phaseId: '',
        startTime: '',
        durationHours: '',
        durationMinutes: '',
        notes: '',
      })
      setEntryType(null)
      fetchEntries()
    } catch {
      setFormError(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCheckin = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!checkinForm.weekStartDate) {
      setFormError(lang === 'es' ? 'La fecha de inicio de semana es obligatoria' : 'Week start date is required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkinForm),
      })

      if (!res.ok) throw new Error('Error')

      setCheckinForm({
        weekStartDate: '',
        fatigueLevel: 3,
        deviations: '',
        adjustmentNotes: '',
      })
      setEntryType(null)
      fetchEntries()
    } catch {
      setFormError(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const prevWeek = () => {
    const d = new Date(currentWeek)
    d.setDate(d.getDate() - 7)
    setCurrentWeek(d)
  }

  const nextWeek = () => {
    const d = new Date(currentWeek)
    d.setDate(d.getDate() + 7)
    setCurrentWeek(d)
  }

  const weekLabel = `${currentWeek.toLocaleDateString(lang === 'es' ? 'es' : 'en', { month: 'short', day: 'numeric' })} - ${new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString(lang === 'es' ? 'es' : 'en', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const fatigueLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: lang === 'es' ? 'Muy bajo' : 'Very low',
      2: lang === 'es' ? 'Bajo' : 'Low',
      3: lang === 'es' ? 'Normal' : 'Normal',
      4: lang === 'es' ? 'Alto' : 'High',
      5: lang === 'es' ? 'Muy alto' : 'Very high',
    }
    return labels[level] || 'Normal'
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {t('progress.title')}
            </h1>
            <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {t('progress.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setEntryType('activity'); setFormError(''); }}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {t('progress.activityLog')}
            </button>
            <button
              onClick={() => { setEntryType('checkin'); setFormError(''); }}
              className="px-4 py-2 border rounded-lg font-medium hover:bg-primary/5 transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              {t('progress.weeklyCheckIn')}
            </button>
          </div>
        </header>

        {/* Modal */}
        {entryType && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--color-bg-surface)] rounded-xl border w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ borderColor: 'var(--color-border)' }}>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {entryType === 'activity' ? t('progress.activityLog') : t('progress.weeklyCheckIn')}
                  </h3>
                  <button
                    onClick={() => setEntryType(null)}
                    className="p-1 rounded-lg hover:bg-primary/10"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    ✕
                  </button>
                </div>

                {formError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                    {formError}
                  </div>
                )}

                {entryType === 'activity' ? (
                  <form onSubmit={handleSaveActivity} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('progress.date')} *</label>
                        <input
                          type="date"
                          value={activityForm.date}
                          onChange={e => setActivityForm(f => ({ ...f, date: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border"
                          style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('progress.startTime')}</label>
                        <input
                          type="time"
                          value={activityForm.startTime}
                          onChange={e => setActivityForm(f => ({ ...f, startTime: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border"
                          style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('progress.goal')} *</label>
                      <select
                        value={activityForm.goalId}
                        onChange={e => setActivityForm(f => ({ ...f, goalId: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        required
                      >
                        <option value="">{lang === 'es' ? 'Seleccionar objetivo' : 'Select goal'}</option>
                        {goals.map(g => (
                          <option key={g.id} value={g.id}>{g.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('progress.phase')}</label>
                      <select
                        value={activityForm.phaseId}
                        onChange={e => setActivityForm(f => ({ ...f, phaseId: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      >
                        <option value="">{lang === 'es' ? 'Seleccionar fase' : 'Select phase'}</option>
                        {phases.sort((a, b) => a.number - b.number).map(p => (
                          <option key={p.id} value={p.id}>Phase {p.number}: {p.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('progress.duration')}</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="Hrs"
                            value={activityForm.durationHours}
                            onChange={e => setActivityForm(f => ({ ...f, durationHours: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border"
                            style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                          />
                          <input
                            type="number"
                            min="0"
                            max="59"
                            placeholder="Min"
                            value={activityForm.durationMinutes}
                            onChange={e => setActivityForm(f => ({ ...f, durationMinutes: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border"
                            style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('progress.notes')}</label>
                      <textarea
                        value={activityForm.notes}
                        onChange={e => setActivityForm(f => ({ ...f, notes: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border resize-none"
                        style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {saving ? t('common.loading') : t('progress.saveProgress')}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSaveCheckin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('progress.weekOf')} *</label>
                      <input
                        type="date"
                        value={checkinForm.weekStartDate}
                        onChange={e => setCheckinForm(f => ({ ...f, weekStartDate: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {t('progress.fatigueLevel')}: <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{fatigueLabel(checkinForm.fatigueLevel)}</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={checkinForm.fatigueLevel}
                        onChange={e => setCheckinForm(f => ({ ...f, fatigueLevel: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        <span>{lang === 'es' ? 'Muy bajo' : 'Very low'}</span>
                        <span>{lang === 'es' ? 'Muy alto' : 'Very high'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('progress.deviations')}</label>
                      <textarea
                        value={checkinForm.deviations}
                        onChange={e => setCheckinForm(f => ({ ...f, deviations: e.target.value }))}
                        placeholder={lang === 'es' ? '¿Qué se desvió del plan?' : 'What deviated from the plan?'}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border resize-none"
                        style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('progress.adjustments')}</label>
                      <textarea
                        value={checkinForm.adjustmentNotes}
                        onChange={e => setCheckinForm(f => ({ ...f, adjustmentNotes: e.target.value }))}
                        placeholder={lang === 'es' ? '¿Qué ajustes propone?' : 'What adjustments do you propose?'}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border resize-none"
                        style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {saving ? t('common.loading') : t('progress.saveCheckIn')}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar - 2/3 */}
          <div className="lg:col-span-2">
            <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-primary/10" style={{ color: 'var(--color-text-muted)' }}>
                  ←
                </button>
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {weekLabel}
                </span>
                <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-primary/10" style={{ color: 'var(--color-text-muted)' }}>
                  →
                </button>
              </div>
              <WeekCalendar entries={entries} weekStart={currentWeek} />

              {/* Activity list below calendar */}
              {entries.length > 0 && (
                <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <h4 className="font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    {lang === 'es' ? 'Actividades registradas' : 'Logged activities'}
                  </h4>
                  <div className="space-y-2">
                    {entries.map(entry => {
                      const entryDate = typeof entry.date === 'string' ? new Date(entry.date) : entry.date
                      const goal = goals.find(g => g.id === entry.goalId)
                      return (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                              {entryDate.toLocaleDateString(lang === 'es' ? 'es' : 'en', { weekday: 'short', day: 'numeric' })}
                            </span>
                            {goal && (
                              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                {goal.title}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {entry.workHours && (
                              <span className="text-xs px-2 py-0.5 rounded bg-primary/10" style={{ color: 'var(--color-primary)' }}>
                                {entry.workHours.toFixed(1)}h
                              </span>
                            )}
                            {entry.studyHours && (
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                                {entry.studyHours.toFixed(1)}h
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Weekly check-in history - 1/3 */}
          <div>
            <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {t('progress.history')}
              </h3>

              {checkins.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                  {lang === 'es' ? 'Sin check-ins registrados' : 'No check-ins recorded'}
                </p>
              ) : (
                <div className="space-y-4">
                  {checkins.slice(0, 8).map(checkin => (
                    <div key={checkin.id} className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {t('progress.weekOf')} {new Date(checkin.weekStartDate).toLocaleDateString(lang === 'es' ? 'es' : 'en')}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: checkin.fatigueLevel >= 4 ? 'rgba(239,68,68,0.1)' :
                              checkin.fatigueLevel <= 2 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                            color: checkin.fatigueLevel >= 4 ? '#ef4444' :
                              checkin.fatigueLevel <= 2 ? '#10b981' : '#f59e0b',
                          }}
                        >
                          {fatigueLabel(checkin.fatigueLevel)}
                        </span>
                      </div>
                      {checkin.deviations && (
                        <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                          <span className="font-medium">{t('progress.deviations')}:</span> {checkin.deviations}
                        </p>
                      )}
                      {checkin.adjustmentNotes && (
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <span className="font-medium">{t('progress.adjustments')}:</span> {checkin.adjustmentNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
