'use client'

import { useAppTranslation } from '@/components/LanguageProvider'
import { formatReminderDate, reminderPriorityConfig } from './helpers'
import type { Reminder, ReminderPriority } from '@/types/reminder'

interface ReminderCardProps {
  reminder: Reminder
  onToggle: (reminder: Reminder) => void
  onEdit: (reminder: Reminder) => void
  onDelete: (id: number) => void
}

export default function ReminderCard({ reminder: r, onToggle, onEdit, onDelete }: ReminderCardProps) {
  const { t } = useAppTranslation()
  const prio = reminderPriorityConfig[r.priority as ReminderPriority] || reminderPriorityConfig.normal
  const due = formatReminderDate(r.dueDate, t)

  return (
    <div
      className={`reminder-card group rounded-[8px] border border-border p-4 ${
        r.completed ? 'reminder-card-completed opacity-60' : ''
      } ${prio.cardClass}`}
      style={prio.cardClass ? undefined : { background: 'var(--color-bg-surface)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggle(r)}
          role="checkbox"
          aria-checked={r.completed}
          className={`reminder-checkbox flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            r.completed ? 'reminder-checkbox-checked border-success bg-success' : 'hover:border-success'
          }`}
          style={r.completed ? undefined : { borderColor: 'var(--color-border)' }}
        >
          {r.completed && <span className="material-symbols-outlined text-xs text-white">check</span>}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-medium ${r.completed ? 'line-through' : ''}`}
              style={{ color: r.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}
            >
              {r.title}
            </span>
            <span className={`material-symbols-outlined text-xs ${prio.iconClass}`}>{prio.icon}</span>
            {r.sourceModule && (
              <span className="rounded-full bg-bg-input px-1.5 py-0.5 text-[10px] capitalize text-text-muted">
                {r.sourceModule}
              </span>
            )}
          </div>
          {r.description && <p className="truncate text-sm text-text-secondary">{r.description}</p>}
          <p className={`mt-0.5 text-xs ${due.className}`}>
            <span className="material-symbols-outlined mr-0.5 align-middle text-xs">schedule</span>
            {due.text}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(r)}
            className="todo-action-btn rounded-[8px] p-1.5 text-text-muted hover:bg-primary/10"
            aria-label={t('common.edit')}
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            onClick={() => onDelete(r.id)}
            className="todo-action-btn todo-action-btn-danger rounded-[8px] p-1.5 text-text-muted"
            aria-label={t('common.delete')}
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}
