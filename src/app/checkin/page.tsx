'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import CheckInForm from '@/components/CheckInForm'
import { WeeklyCheckIn } from '@/types/goal'
import { useAppTranslation } from '@/components/LanguageProvider'

export default function CheckInPage() {
  const { t, language } = useAppTranslation()
  const [checkins, setCheckins] = useState<WeeklyCheckIn[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCheckins = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/checkin')
      if (!res.ok) throw new Error(t('progress.loadError'))

      const data = await res.json()
      setCheckins(data.checkins)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCheckins()
  }, [fetchCheckins])

  const handleSubmit = async (data: any) => {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || t('progress.saveError'))
    }

    await fetchCheckins()
  }

  const fatigueLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: t('progress.veryLowFatigue'),
      2: t('progress.lowFatigue'),
      3: t('progress.normalFatigue'),
      4: t('progress.highFatigue'),
      5: t('progress.veryHighFatigue'),
    }
    return labels[level] || t('progress.normalFatigue')
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('progress.weeklyCheckIn')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {t('progress.subtitle')}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {t('progress.newCheckIn')}
              </h3>
              <CheckInForm onSubmit={handleSubmit} />
            </div>

            {checkins.length > 0 && (
              <div className="mt-6 dashboard-card rounded-xl p-6 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  {t('progress.historyLabel')}
                </h3>
                <div className="space-y-4">
                  {checkins.map(checkin => (
                    <div key={checkin.id} className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {t('progress.weekOfDate', { date: new Date(checkin.weekStartDate).toLocaleDateString(language === 'es' ? 'es' : 'en') })}
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
                          {t('progress.fatigue')}: {fatigueLabel(checkin.fatigueLevel)}
                        </span>
                      </div>
                      {checkin.completedHours && (
                        <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                          {t('progress.hoursCompleted')}: {checkin.completedHours}
                        </p>
                      )}
                      {checkin.deviations && (
                        <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                          <span className="font-medium">{t('progress.deviations')}:</span> {checkin.deviations}
                        </p>
                      )}
                      {checkin.adjustmentNotes && (
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          <span className="font-medium">{t('progress.adjustments')}:</span> {checkin.adjustmentNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
