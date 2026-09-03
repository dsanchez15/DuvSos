'use client'

import { useState } from 'react'
import { Button, Card, Input } from '@/components/ui'
import { apiClient, ApiError } from '@/lib/api-client'
import { useAppTranslation } from '@/components/LanguageProvider'

interface QuickRegisterFormProps {
  onRegistered: () => void
}

export default function QuickRegisterForm({ onRegistered }: QuickRegisterFormProps) {
  const { t } = useAppTranslation()
  const [form, setForm] = useState({ sleepHours: '', studyHours: '', workHours: '', gymCompleted: false })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.gymCompleted && form.sleepHours && parseFloat(form.sleepHours) < 7) {
      alert(t('dashboard.gymSleepWarning'))
      return
    }
    try {
      await apiClient.post('/api/progress/daily', {
        date: new Date().toISOString().split('T')[0],
        sleepHours: form.sleepHours ? parseFloat(form.sleepHours) : null,
        studyHours: form.studyHours ? parseFloat(form.studyHours) : null,
        workHours: form.workHours ? parseFloat(form.workHours) : null,
        gymCompleted: form.gymCompleted,
      })
      setForm({ sleepHours: '', studyHours: '', workHours: '', gymCompleted: false })
      onRegistered()
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message || t('common.error'))
      } else {
        console.error(err)
      }
    }
  }

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
        {t('dashboard.quickRegister')}
      </h3>
      <Card className="dashboard-card">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Input
              label={t('dashboard.sleep')}
              fieldSize="sm"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={form.sleepHours}
              onChange={(e) => set('sleepHours', e.target.value)}
              placeholder="7.5"
            />
            <Input
              label={t('dashboard.study')}
              fieldSize="sm"
              type="number"
              step="0.5"
              min="0"
              value={form.studyHours}
              onChange={(e) => set('studyHours', e.target.value)}
              placeholder="2"
            />
            <Input
              label={t('dashboard.work')}
              fieldSize="sm"
              type="number"
              step="0.5"
              min="0"
              value={form.workHours}
              onChange={(e) => set('workHours', e.target.value)}
              placeholder="1"
            />
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => set('gymCompleted', !form.gymCompleted)}
                className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  form.gymCompleted
                    ? 'border-transparent bg-success text-white'
                    : 'border-border bg-bg-input text-text-secondary'
                }`}
              >
                {form.gymCompleted ? t('dashboard.gymDone') : t('dashboard.gym')}
              </button>
            </div>
          </div>
          {form.gymCompleted && form.sleepHours && parseFloat(form.sleepHours) < 7 && (
            <p className="text-xs text-warning">⚠️ {t('dashboard.gymSleepWarning')}</p>
          )}
          <Button type="submit" fullWidth size="sm">
            {t('dashboard.registerDay')}
          </Button>
        </form>
      </Card>
    </section>
  )
}
