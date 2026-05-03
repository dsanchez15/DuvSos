'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import DayTracker from '@/components/DayTracker'
import WeekCalendar from '@/components/WeekCalendar'
import { DailyProgress, WeeklyCheckIn } from '@/types/goal'

export default function ProgressPage() {
  const [entries, setEntries] = useState<DailyProgress[]>([])
  const [checkins, setCheckins] = useState<WeeklyCheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [activeTab, setActiveTab] = useState<'daily' | 'checkin'>('daily')
  const [checkinForm, setCheckinForm] = useState({ fatigueLevel: 3, deviations: '', adjustmentNotes: '' })
  const [savingCheckin, setSavingCheckin] = useState(false)

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true)
      const end = new Date(currentWeek)
      end.setDate(end.getDate() + 6)

      const res = await fetch(`/api/progress/daily?startDate=${currentWeek.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`)
      if (!res.ok) throw new Error('Error al cargar progreso')

      const data = await res.json()
      setEntries(data.entries)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentWeek])

  useEffect(() => {
    fetchEntries()
    fetchCheckins()
  }, [fetchEntries])

  const fetchCheckins = async () => {
    try {
      const res = await fetch('/api/checkin')
      if (res.ok) {
        const data = await res.json()
        setCheckins(data.checkins)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmitProgress = async (data: any) => {
    const res = await fetch('/api/progress/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al guardar')
    }

    await fetchEntries()
  }

  const handleSubmitCheckin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCheckin(true)

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStartDate: currentWeek.toISOString().split('T')[0],
          ...checkinForm,
        }),
      })

      if (!res.ok) throw new Error('Error al guardar check-in')
      setCheckinForm({ fatigueLevel: 3, deviations: '', adjustmentNotes: '' })
      fetchCheckins()
    } finally {
      setSavingCheckin(false)
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

  const weekLabel = `${currentWeek.toLocaleDateString('es', { month: 'short', day: 'numeric' })} - ${new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('es', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const fatigueLabel = (level: number) => {
    const labels = { 1: 'Muy bajo', 2: 'Bajo', 3: 'Normal', 4: 'Alto', 5: 'Muy alto' }
    return labels[level as keyof typeof labels] || 'Normal'
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Progress y Check-in
            </h1>
            <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Registra tu actividad y reflexiona sobre tu plan
            </p>
          </div>
        </header>

        <div className="flex gap-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'daily'
                ? 'text-primary border-b-2 border-primary'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Registro diario
          </button>
          <button
            onClick={() => setActiveTab('checkin')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'checkin'
                ? 'text-primary border-b-2 border-primary'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Check-in semanal
          </button>
        </div>

        {activeTab === 'daily' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              </div>
            </div>

            <div>
              <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Registrar día
                </h3>
                <DayTracker onSubmit={handleSubmitProgress} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checkin' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Nuevo check-in
                </h3>
                <form onSubmit={handleSubmitCheckin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Nivel de fatiga: <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{fatigueLabel(checkinForm.fatigueLevel)}</span>
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
                      <span>Muy bajo</span>
                      <span>Muy alto</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Desviaciones
                    </label>
                    <textarea
                      value={checkinForm.deviations}
                      onChange={e => setCheckinForm(f => ({ ...f, deviations: e.target.value }))}
                      placeholder="¿Qué se desvió del plan?"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border resize-none"
                      style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Ajustes
                    </label>
                    <textarea
                      value={checkinForm.adjustmentNotes}
                      onChange={e => setCheckinForm(f => ({ ...f, adjustmentNotes: e.target.value }))}
                      placeholder="¿Qué ajustes propone para la próxima semana?"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border resize-none"
                      style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingCheckin}
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {savingCheckin ? 'Guardando...' : 'Guardar check-in'}
                  </button>
                </form>
              </div>

              {checkins.length > 0 && (
                <div className="mt-6 dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                    Historial
                  </h3>
                  <div className="space-y-4">
                    {checkins.slice(0, 6).map(checkin => (
                      <div key={checkin.id} className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            Semana del {new Date(checkin.weekStartDate).toLocaleDateString('es')}
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
                            Fatiga: {fatigueLabel(checkin.fatigueLevel)}
                          </span>
                        </div>
                        {checkin.deviations && (
                          <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <span className="font-medium">Desviaciones:</span> {checkin.deviations}
                          </p>
                        )}
                        {checkin.adjustmentNotes && (
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            <span className="font-medium">Ajustes:</span> {checkin.adjustmentNotes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}