'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'

export interface ExceptionEntry {
  date: string
  reason: string
}

interface ExceptionsManagerProps {
  exceptions: ExceptionEntry[]
  onChange: (exceptions: ExceptionEntry[]) => void
}

export default function ExceptionsManager({ exceptions, onChange }: ExceptionsManagerProps) {
  const { t } = useAppTranslation()
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')

  const addException = () => {
    if (!newDate) return
    onChange([...exceptions, { date: newDate, reason: newReason }])
    setNewDate('')
    setNewReason('')
  }

  const removeException = (idx: number) => {
    onChange(exceptions.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-text-secondary">
        {t('reminders.form.exceptions')}
      </label>
      <div className="mb-2 flex gap-2">
        <Input
          fieldSize="sm"
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          aria-label={t('reminders.form.exceptions')}
        />
        <Input
          fieldSize="sm"
          type="text"
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          placeholder={t('reminders.form.reason')}
        />
        <Button variant="secondary" size="sm" onClick={addException} className="shrink-0">
          {t('reminders.form.add')}
        </Button>
      </div>
      {exceptions.length > 0 && (
        <div className="space-y-1">
          {exceptions.map((exc, i) => (
            <div key={i} className="flex items-center justify-between rounded-[8px] bg-bg-input px-3 py-1.5 text-sm">
              <span className="text-text-secondary">
                {exc.date} {exc.reason && `— ${exc.reason}`}
              </span>
              <button
                type="button"
                onClick={() => removeException(i)}
                className="reminder-remove-btn text-text-muted"
                aria-label={t('common.delete')}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
