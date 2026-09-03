'use client'

import { Input, Select } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'

export type RecurrenceFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'annual'

export interface RecurrenceValue {
  frequency: RecurrenceFrequency
  interval: number
  daysOfWeek: number[]
  dayOfMonth: string
  monthOfYear: string
  endDate: string
}

interface RecurrenceFieldsProps {
  value: RecurrenceValue
  onChange: (value: RecurrenceValue) => void
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function RecurrenceFields({ value, onChange }: RecurrenceFieldsProps) {
  const { t } = useAppTranslation()

  const set = <K extends keyof RecurrenceValue>(key: K, v: RecurrenceValue[K]) =>
    onChange({ ...value, [key]: v })

  const toggleDayOfWeek = (day: number) => {
    set(
      'daysOfWeek',
      value.daysOfWeek.includes(day)
        ? value.daysOfWeek.filter((d) => d !== day)
        : [...value.daysOfWeek, day]
    )
  }

  return (
    <>
      <Select
        label={t('reminders.form.recurrence')}
        value={value.frequency}
        onChange={(e) => set('frequency', e.target.value as RecurrenceFrequency)}
      >
        <option value="once">{t('reminders.form.once')}</option>
        <option value="daily">{t('reminders.form.daily')}</option>
        <option value="weekly">{t('reminders.form.weekly')}</option>
        <option value="monthly">{t('reminders.form.monthly')}</option>
        <option value="annual">{t('reminders.form.annual')}</option>
      </Select>

      {value.frequency !== 'once' && (
        <div className="space-y-3 rounded-[8px] bg-bg-input p-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('reminders.form.interval')}
              type="number"
              min={1}
              value={value.interval}
              onChange={(e) => set('interval', parseInt(e.target.value) || 1)}
            />
            <Input
              label={t('reminders.form.endDate')}
              type="date"
              value={value.endDate}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </div>

          {value.frequency === 'weekly' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                {t('reminders.form.daysOfWeek')}
              </label>
              <div className="flex gap-1">
                {WEEKDAY_LETTERS.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDayOfWeek(i)}
                    className={`h-8 w-8 rounded-[8px] text-xs font-medium transition-colors ${
                      value.daysOfWeek.includes(i)
                        ? 'bg-primary text-white'
                        : 'border border-border bg-bg-surface text-text-secondary'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {value.frequency === 'monthly' && (
            <Input
              label={t('reminders.form.dayOfMonth')}
              type="number"
              min={1}
              max={31}
              value={value.dayOfMonth}
              onChange={(e) => set('dayOfMonth', e.target.value)}
            />
          )}

          {value.frequency === 'annual' && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('reminders.form.month')}
                type="number"
                min={1}
                max={12}
                value={value.monthOfYear}
                onChange={(e) => set('monthOfYear', e.target.value)}
              />
              <Input
                label={t('reminders.form.day')}
                type="number"
                min={1}
                max={31}
                value={value.dayOfMonth}
                onChange={(e) => set('dayOfMonth', e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}
