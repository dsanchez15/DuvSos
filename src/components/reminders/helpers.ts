import type { ReminderPriority } from '@/types/reminder'

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

export const reminderPriorityConfig: Record<ReminderPriority, { icon: string; iconClass: string; cardClass: string }> = {
  high: { icon: 'arrow_upward', iconClass: 'text-danger', cardClass: 'bg-danger/5' },
  normal: { icon: 'remove', iconClass: 'reminder-prio-normal-icon', cardClass: '' },
  low: { icon: 'arrow_downward', iconClass: 'text-info', cardClass: 'bg-info/5' },
}

export interface ReminderDateDisplay {
  text: string
  className: string
}

export function formatReminderDate(d: string, t: TranslateFn): ReminderDateDisplay {
  const date = new Date(d)
  const now = new Date()
  const diff = Math.ceil((date.getTime() - now.getTime()) / 86400000)
  const formatted = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
  if (diff < 0) return { text: t('reminders.date.overdue', { date: formatted }), className: 'text-danger font-medium' }
  if (diff === 0) return { text: t('reminders.date.today'), className: 'text-warning font-medium' }
  if (diff === 1) return { text: t('reminders.date.tomorrow'), className: 'text-warning' }
  if (diff <= 3) return { text: t('reminders.date.daysUntil', { date: formatted, count: diff }), className: 'text-warning' }
  return { text: formatted, className: 'reminder-date-default' }
}
