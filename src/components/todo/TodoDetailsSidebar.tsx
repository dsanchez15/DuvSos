'use client'

import type { Todo, TodoMetrics } from '@/types/todo'
import { formatEffort, formatDate } from '@/lib/todo-utils'
import { useAppTranslation } from '@/components/LanguageProvider'

interface TodoDetailsSidebarProps {
  todo: Todo | null
  metrics: TodoMetrics | null
}

export default function TodoDetailsSidebar({ todo, metrics }: TodoDetailsSidebarProps) {
  const { t } = useAppTranslation()

  return (
    <div className="w-72 shrink-0">
      <div className="sticky top-6 flex flex-col gap-4">
        {/* Todo Details Card */}
        <div className="todo-section-card">
          <h3 className="text-xl font-bold mb-5 todo-text-primary">
            {t('todos.details.title')}
          </h3>
          <div className="grid grid-cols-2 gap-y-5 gap-x-4">
            {/* Category */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-1 todo-text-muted">
                {t('todos.details.category')}
              </p>
              {todo?.category ? (
                <p className="text-sm font-medium todo-text-primary">{todo.category.name}</p>
              ) : (
                <p className="text-sm todo-text-muted">{t('todos.details.none')}</p>
              )}
            </div>
            {/* Status */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-1 todo-text-muted">
                {t('todos.details.status')}
              </p>
              {todo ? (
                <p
                  className="text-sm font-medium"
                  style={{ color: todo.completed ? 'var(--color-success)' : 'var(--color-info)' }}
                >
                  {todo.completed ? t('todos.statuses.completed') : t('todos.statuses.pending')}
                </p>
              ) : (
                <p className="text-sm todo-text-muted">{t('todos.details.none')}</p>
              )}
            </div>
            {/* Priority */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-1 todo-text-muted">
                {t('todos.details.priority')}
              </p>
              {todo?.priority ? (
                <p className="text-sm font-medium todo-text-primary">
                  {t(`todos.priorities.${todo.priority}`)}
                </p>
              ) : (
                <p className="text-sm todo-text-muted">{t('todos.details.none')}</p>
              )}
            </div>
            {/* Date */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-1 todo-text-muted">
                {t('todos.details.date')}
              </p>
              {todo?.dueDate ? (
                <p className="text-sm font-medium todo-text-primary">
                  {formatDate(todo.dueDate)}
                  {todo.dueTime && ` ${todo.dueTime}`}
                </p>
              ) : (
                <p className="text-sm todo-text-muted">{t('todos.details.none')}</p>
              )}
            </div>
            {/* Effort */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-1 todo-text-muted">
                {t('todos.details.effort')}
              </p>
              {todo && todo.effortMinutes > 0 ? (
                <p className="text-sm font-medium todo-text-primary">
                  {formatEffort(todo.effortMinutes)}
                </p>
              ) : (
                <p className="text-sm todo-text-muted">{t('todos.details.none')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[1px]"></div>

        {/* Statistics Card */}
        {metrics && (
          <div className="todo-section-card">
            <h3 className="text-xl font-bold mb-1 todo-text-primary">
              {t('todos.statistics.title')}
            </h3>
            <p className="text-xs mb-6 todo-text-muted">
              {t('todos.statistics.subtitle')}
            </p>
            <div className="space-y-5">
              {/* All Tasks */}
              <div className="flex justify-between items-center">
                <span className="todo-text-secondary">{t('todos.statistics.allTasks')}</span>
                <span className="text-lg font-semibold todo-text-primary">{metrics.total}</span>
              </div>

              {/* Pending */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-info)' }}></span>
                  <span className="todo-text-secondary">{t('todos.statuses.pending')}</span>
                </div>
                <span className="text-lg font-semibold" style={{ color: 'var(--color-info)' }}>{metrics.pending}</span>
              </div>

              {/* Completed */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-success)' }}></span>
                  <span className="todo-text-secondary">{t('todos.statuses.completed')}</span>
                </div>
                <span className="text-lg font-semibold" style={{ color: 'var(--color-success)' }}>{metrics.completed}</span>
              </div>

              {/* Overdue */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-danger)' }}></span>
                  <span className="todo-text-secondary">{t('todos.overdue')}</span>
                </div>
                <span className="text-lg font-semibold" style={{ color: 'var(--color-danger)' }}>{metrics.overdue}</span>
              </div>

              {/* Bottom boxes: Effort & Compliance */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="todo-stat-box">
                  <p className="todo-stat-label">{t('todos.statistics.effort')}</p>
                  <p className="todo-stat-value">
                    {formatEffort(metrics.totalEffortMinutes)}
                  </p>
                </div>
                <div className="todo-stat-box">
                  <p className="todo-stat-label">{t('todos.statistics.compliance')}</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--color-danger)' }}>
                    {metrics.completionRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}