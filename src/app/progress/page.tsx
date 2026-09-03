'use client'

import { useState } from 'react'
import AppLayout from '@/components/AppLayout'
import WeekCalendar from '@/components/WeekCalendar'
import { Button, Card, Modal } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import { useProgressData } from '@/hooks/useProgressData'
import ActivityForm from '@/components/progress/ActivityForm'
import CheckinForm from '@/components/progress/CheckinForm'
import ActivityList from '@/components/progress/ActivityList'
import CheckinHistory from '@/components/progress/CheckinHistory'

type EntryType = 'activity' | 'checkin' | null

export default function ProgressPage() {
  const { t, language: lang } = useAppTranslation()
  const { entries, checkins, goals, phases, currentWeek, prevWeek, nextWeek, refetch } = useProgressData()

  const [entryType, setEntryType] = useState<EntryType>(null)
  const [saving, setSaving] = useState(false)

  const weekEnd = new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
  const locale = lang === 'es' ? 'es' : 'en'
  const weekLabel = `${currentWeek.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`

  const handleSaved = () => {
    setEntryType(null)
    refetch()
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{t('progress.title')}</h1>
            <p className="mt-1 text-text-secondary">{t('progress.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setEntryType('activity')}>{t('progress.activityLog')}</Button>
            <Button variant="secondary" onClick={() => setEntryType('checkin')} className="border border-border">
              {t('progress.weeklyCheckIn')}
            </Button>
          </div>
        </header>

        {/* Entry Modal */}
        {entryType && (
          <Modal
            isOpen={true}
            onClose={() => setEntryType(null)}
            title={entryType === 'activity' ? t('progress.activityLog') : t('progress.weeklyCheckIn')}
          >
            {entryType === 'activity' ? (
              <ActivityForm goals={goals} phases={phases} saving={saving} setSaving={setSaving} onSaved={handleSaved} />
            ) : (
              <CheckinForm saving={saving} setSaving={setSaving} onSaved={handleSaved} />
            )}
          </Modal>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Calendar - 2/3 */}
          <div className="lg:col-span-2">
            <Card padding="lg" className="dashboard-card">
              <div className="mb-4 flex items-center justify-between">
                <button onClick={prevWeek} aria-label="Previous week" className="rounded-[8px] p-2 text-text-muted hover:bg-primary/10">
                  ←
                </button>
                <span className="font-medium text-text-primary">{weekLabel}</span>
                <button onClick={nextWeek} aria-label="Next week" className="rounded-[8px] p-2 text-text-muted hover:bg-primary/10">
                  →
                </button>
              </div>
              <WeekCalendar entries={entries} weekStart={currentWeek} />
              <ActivityList entries={entries} goals={goals} />
            </Card>
          </div>

          {/* Weekly check-in history - 1/3 */}
          <div>
            <CheckinHistory checkins={checkins} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
