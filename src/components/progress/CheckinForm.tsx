'use client'

import { useState } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import { apiClient } from '@/lib/api-client'
import { useAppTranslation } from '@/components/LanguageProvider'
import { fatigueLabel } from './fatigue'

interface CheckinFormProps {
  saving: boolean
  setSaving: (saving: boolean) => void
  onSaved: () => void
}

export default function CheckinForm({ saving, setSaving, onSaved }: CheckinFormProps) {
  const { t } = useAppTranslation()
  const [form, setForm] = useState({
    weekStartDate: '',
    fatigueLevel: 3,
    deviations: '',
    adjustmentNotes: '',
  })
  const [formError, setFormError] = useState('')

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!form.weekStartDate) {
      setFormError(t('progress.weekStartRequired'))
      return
    }

    setSaving(true)
    try {
      await apiClient.post('/api/checkin', form)
      setForm({ weekStartDate: '', fatigueLevel: 3, deviations: '', adjustmentNotes: '' })
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

      <Input
        label={`${t('progress.weekOf')} *`}
        type="date"
        value={form.weekStartDate}
        onChange={(e) => set('weekStartDate', e.target.value)}
        required
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          {t('progress.fatigueLevel')}: <span className="font-bold text-text-primary">{fatigueLabel(form.fatigueLevel, t)}</span>
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={form.fatigueLevel}
          onChange={(e) => set('fatigueLevel', parseInt(e.target.value))}
          aria-label={t('progress.fatigueLevel')}
          className="w-full accent-primary"
        />
        <div className="mt-1 flex justify-between text-xs text-text-muted">
          <span>{t('progress.veryLowFatigue')}</span>
          <span>{t('progress.veryHighFatigue')}</span>
        </div>
      </div>

      <Textarea
        label={t('progress.deviations')}
        value={form.deviations}
        onChange={(e) => set('deviations', e.target.value)}
        placeholder={t('progress.deviationsPlaceholder')}
        rows={2}
        className="resize-none"
      />

      <Textarea
        label={t('progress.adjustments')}
        value={form.adjustmentNotes}
        onChange={(e) => set('adjustmentNotes', e.target.value)}
        placeholder={t('progress.adjustmentNotesPlaceholder')}
        rows={2}
        className="resize-none"
      />

      <Button type="submit" fullWidth disabled={saving}>
        {saving ? t('common.loading') : t('progress.saveCheckIn')}
      </Button>
    </form>
  )
}
