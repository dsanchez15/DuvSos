'use client'

import { useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { Button, EmptyState, Spinner } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import { useReminders, type ReminderFilter } from '@/hooks/useReminders'
import ReminderCard from '@/components/reminders/ReminderCard'
import ReminderFormModal from '@/components/reminders/ReminderFormModal'
import type { Reminder } from '@/types/reminder'

const FILTER_TABS: ReminderFilter[] = ['pending', 'all', 'completed']

export default function RemindersPage() {
  const { t } = useAppTranslation()
  const {
    filtered,
    loading,
    filter,
    setFilter,
    pendingCount,
    completedCount,
    fetchReminders,
    toggleReminder,
    deleteReminder,
  } = useReminders()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)

  const openNew = () => {
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (r: Reminder) => {
    setEditing(r)
    setShowForm(true)
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditing(null)
    fetchReminders()
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{t('reminders.title')}</h2>
            <p className="mt-1 text-text-secondary">
              {t('reminders.subtitle', { pending: pendingCount, completed: completedCount })}
            </p>
          </div>
          <Button onClick={openNew}>
            <span className="material-symbols-outlined text-sm">add</span>
            {t('reminders.newReminder')}
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {FILTER_TABS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`reminder-filter-btn rounded-[8px] px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'reminder-filter-btn-active bg-primary text-white'
                  : 'reminder-filter-btn-inactive bg-bg-input text-text-secondary'
              }`}
            >
              {t(`reminders.filters.${f}`)}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState icon="notifications_active" title={t('reminders.noReminders')} />
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onToggle={toggleReminder}
                onEdit={openEdit}
                onDelete={deleteReminder}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <ReminderFormModal reminder={editing} onSaved={handleSaved} onClose={() => setShowForm(false)} />
      )}
    </AppLayout>
  )
}
