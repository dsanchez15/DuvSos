'use client'

import { useState } from 'react'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { apiClient } from '@/lib/api-client'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { Goal, Phase } from '@/types/goal'

interface ActivityFormProps {
  goals: Goal[]
  phases: Phase[]
  saving: boolean
  setSaving: (saving: boolean) => void
  onSaved: () => void
}

export default function ActivityForm({ goals, phases, saving, setSaving, onSaved }: ActivityFormProps) {
  const { t } = useAppTranslation()
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    goalId: '',
    phaseId: '',
    startTime: '',
    durationHours: '',
    durationMinutes: '',
    notes: '',
  })
  const [formError, setFormError] = useState('')

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!form.date || !form.goalId) {
      setFormError(t('progress.dateGoalRequired'))
      return
    }

    const hours = parseFloat(form.durationHours || '0')
    const minutes = parseFloat(form.durationMinutes || '0')
    const totalHours = hours + minutes / 60

    setSaving(true)
    try {
      await apiClient.post('/api/progress/daily', {
        date: form.date,
        goalId: form.goalId,
        plannedTime: form.startTime || null,
        actualTime: form.startTime || null,
        workHours: totalHours,
        notes: form.notes.trim() || null,
      })
      setForm({
        date: new Date().toISOString().split('T')[0],
        goalId: '',
        phaseId: '',
        startTime: '',
        durationHours: '',
        durationMinutes: '',
        notes: '',
      })
      onSaved()
    } catch {
      setFormError(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="rounded-[8px] bg-danger/10 p-3 text-sm text-danger">{formError}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={`${t('progress.date')} *`}
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          required
        />
        <Input
          label={t('progress.startTime')}
          type="time"
          value={form.startTime}
          onChange={(e) => set('startTime', e.target.value)}
        />
      </div>

      <Select
        label={`${t('progress.phase')} *`}
        value={form.phaseId}
        onChange={(e) => setForm((f) => ({ ...f, phaseId: e.target.value, goalId: '' }))}
        required
      >
        <option value="">{t('progress.selectPhase')}</option>
        {[...phases]
          .sort((a, b) => a.number - b.number)
          .map((p) => (
            <option key={p.id} value={p.id}>
              Phase {p.number}: {p.title}
            </option>
          ))}
      </Select>

      <Select
        label={`${t('progress.goal')} *`}
        value={form.goalId}
        onChange={(e) => set('goalId', e.target.value)}
        required
        disabled={!form.phaseId}
      >
        <option value="">{t('progress.selectGoal')}</option>
        {goals
          .filter((g) => !form.phaseId || g.phaseId === form.phaseId)
          .map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
      </Select>

      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">{t('progress.duration')}</label>
        <div className="flex gap-2">
          <Input
            type="number"
            min="0"
            placeholder="Hrs"
            value={form.durationHours}
            onChange={(e) => set('durationHours', e.target.value)}
            aria-label="Hours"
          />
          <Input
            type="number"
            min="0"
            max="59"
            placeholder="Min"
            value={form.durationMinutes}
            onChange={(e) => set('durationMinutes', e.target.value)}
            aria-label="Minutes"
          />
        </div>
      </div>

      <Textarea
        label={t('progress.notes')}
        value={form.notes}
        onChange={(e) => set('notes', e.target.value)}
        rows={2}
        className="resize-none"
      />

      <Button type="submit" fullWidth disabled={saving}>
        {saving ? t('common.loading') : t('progress.saveProgress')}
      </Button>
    </form>
  )
}
