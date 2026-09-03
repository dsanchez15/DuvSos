'use client'

import { Card } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { DashboardChecklistItem, DashboardTodo } from '@/types/dashboard'

interface TaskListsProps {
  checklists: DashboardChecklistItem[]
  todos: DashboardTodo[]
  showChecklists?: boolean
  onMarkChecklistItemDone: (checklistId: number, itemId: number) => void
  onMarkTodoDone: (id: number) => void
}

function DoneButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="whitespace-nowrap rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20"
    >
      {label}
    </button>
  )
}

export default function TaskLists({
  checklists,
  todos,
  showChecklists = true,
  onMarkChecklistItemDone,
  onMarkTodoDone,
}: TaskListsProps) {
  const { t } = useAppTranslation()

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
        {showChecklists ? t('dashboard.checklistsAndTodos') : t('dashboard.todos')}
      </h3>
      <div className={`grid grid-cols-1 gap-4 ${showChecklists ? 'lg:grid-cols-2' : ''}`}>
        {/* Checklists */}
        {showChecklists && (
        <Card className="dashboard-card">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="card-title flex items-center gap-2 font-semibold text-text-primary">
              <span className="h-2 w-2 rounded-full bg-warning" />
              {t('dashboard.checklists')}
            </h4>
            <span className="text-xs text-text-muted">{t('dashboard.pendingCount', { count: checklists.length })}</span>
          </div>
          <div className="max-h-[280px] space-y-2 overflow-y-auto">
            {checklists.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">{t('dashboard.noPendingChecklists')}</p>
            )}
            {checklists.map((item) => (
              <div key={`cl-${item.id}`} className="flex items-center gap-3 rounded-[8px] border border-border p-3">
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: item.checklistColor }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
                  <p className="text-xs text-text-muted">
                    {item.checklistTitle} · {item.priority}
                  </p>
                </div>
                <DoneButton onClick={() => onMarkChecklistItemDone(item.checklistId, item.id)} label={t('common.done')} />
              </div>
            ))}
          </div>
        </Card>
        )}

        {/* ToDos */}
        <Card className="dashboard-card">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="card-title flex items-center gap-2 font-semibold text-text-primary">
              <span className="h-2 w-2 rounded-full bg-danger" />
              {t('dashboard.todos')}
            </h4>
            <span className="text-xs text-text-muted">{t('dashboard.pendingCount', { count: todos.length })}</span>
          </div>
          <div className="max-h-[280px] space-y-2 overflow-y-auto">
            {todos.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">{t('dashboard.noPendingTodos')}</p>
            )}
            {todos.map((todo) => (
              <div key={`td-${todo.id}`} className="flex items-center gap-3 rounded-[8px] border border-border p-3">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-danger" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{todo.title}</p>
                  <p className="text-xs text-text-muted">
                    {todo.dueDate && `${todo.dueDate} · `}
                    {todo.priority}
                    {todo.category?.name && ` · ${todo.category.name}`}
                  </p>
                </div>
                <DoneButton onClick={() => onMarkTodoDone(todo.id)} label={t('common.done')} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
