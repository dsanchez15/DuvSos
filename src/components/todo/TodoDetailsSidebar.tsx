'use client'

import { Card } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import { formatDate, formatEffort } from '@/lib/todo-utils'
import type { Todo, TodoMetrics } from '@/types/todo'

interface TodoDetailsSidebarProps {
  todo: Todo | null
  metrics: TodoMetrics | null
}

function DetailField({ label, children }: { label: string; children?: React.ReactNode }) {
  const { t } = useAppTranslation()
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-text-muted">{label}</p>
      {children ? (
        <div className="text-sm font-medium text-text-primary">{children}</div>
      ) : (
        <p className="text-sm text-text-muted">{t('todos.details.none')}</p>
      )}
    </div>
  )
}

function StatRow({ dotClass, label, valueClass, value }: { dotClass?: string; label: string; valueClass?: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {dotClass && <span className={`h-2 w-2 rounded-full ${dotClass}`} />}
        <span className="text-text-secondary">{label}</span>
      </div>
      <span className={`text-lg font-semibold ${valueClass ?? 'text-text-primary'}`}>{value}</span>
    </div>
  )
}

export default function TodoDetailsSidebar({ todo, metrics }: TodoDetailsSidebarProps) {
  const { t } = useAppTranslation()

  return (
    <div className="sticky top-6 flex w-72 shrink-0 flex-col gap-4">
      {/* Details */}
      <Card padding="lg">
        <h3 className="mb-5 text-xl font-bold text-text-primary">{t('todos.details.title')}</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <DetailField label={t('todos.details.category')}>
            {todo?.category ? todo.category.name : undefined}
          </DetailField>
          <DetailField label={t('todos.details.status')}>
            {todo ? (
              <span style={{ color: todo.completed ? 'var(--color-success)' : 'var(--color-info)' }}>
                {todo.completed ? t('todos.statuses.completed') : t('todos.statuses.pending')}
              </span>
            ) : undefined}
          </DetailField>
          <DetailField label={t('todos.details.priority')}>
            {todo?.priority ? t(`todos.priorities.${todo.priority}`) : undefined}
          </DetailField>
          <DetailField label={t('todos.details.date')}>
            {todo?.dueDate ? `${formatDate(todo.dueDate)}${todo.dueTime ? ` ${todo.dueTime}` : ''}` : undefined}
          </DetailField>
          <DetailField label={t('todos.details.effort')}>
            {todo && todo.effortMinutes > 0 ? formatEffort(todo.effortMinutes) : undefined}
          </DetailField>
        </div>
      </Card>

      {/* Statistics */}
      <Card padding="lg">
        <h3 className="mb-1 text-xl font-bold text-text-primary">{t('todos.statistics.title')}</h3>
        <p className="mb-6 text-xs text-text-muted">{t('todos.statistics.subtitle')}</p>
        {metrics && (
          <div className="space-y-5">
            <StatRow label={t('todos.statistics.allTasks')} value={metrics.total} />
            <StatRow dotClass="bg-info" valueClass="text-info" label={t('todos.statuses.pending')} value={metrics.pending} />
            <StatRow dotClass="bg-success" valueClass="text-success" label={t('todos.statuses.completed')} value={metrics.completed} />
            <StatRow dotClass="bg-danger" valueClass="text-danger" label={t('todos.overdue')} value={metrics.overdue} />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-[8px] bg-bg-surface-hover p-3">
                <p className="mb-1 text-xs text-text-muted">{t('todos.statistics.effort')}</p>
                <p className="text-xl font-bold text-text-primary">{formatEffort(metrics.totalEffortMinutes)}</p>
              </div>
              <div className="rounded-[8px] bg-bg-surface-hover p-3">
                <p className="mb-1 text-xs text-text-muted">{t('todos.statistics.compliance')}</p>
                <p className="text-xl font-bold text-danger">{metrics.completionRate}%</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
