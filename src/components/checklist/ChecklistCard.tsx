'use client'

import { useAppTranslation } from '@/components/LanguageProvider'
import { getProgress, getStatus } from './helpers'
import type { Checklist } from '@/types/checklist'

interface ChecklistCardProps {
  checklist: Checklist
  isExpanded: boolean
  isTemplate: boolean
  isHistory: boolean
  onToggleExpand: (id: number) => void
  onEdit: (c: Checklist) => void
  onDuplicate: (id: number) => void
  onDelete: (id: number) => void
  onArchive?: (id: number) => void
  onInstantiateTemplate?: (template: Checklist) => void
  children?: React.ReactNode
}

export default function ChecklistCard({
  checklist: c,
  isExpanded,
  isTemplate,
  isHistory,
  onToggleExpand,
  onEdit,
  onDuplicate,
  onDelete,
  onArchive,
  onInstantiateTemplate,
  children,
}: ChecklistCardProps) {
  const { t } = useAppTranslation()
  const progress = getProgress(c)
  const status = getStatus(c)

  const itemsList = Array.isArray(c.items) ? c.items : []
  const checklistWithMetrics = c as Checklist & {
    metrics?: { totalItems: number; completedItems: number; completionPercentage: number; totalEffort: number }
  }
  const metrics = checklistWithMetrics.metrics

  return (
    <div
      className={`checklist-card rounded-[8px] border transition-all ${
        isExpanded ? 'checklist-card-expanded border-primary/40 shadow-sm' : 'checklist-card-hover'
      }`}
      style={{
        background: 'var(--color-bg-surface)',
        borderColor: isExpanded ? undefined : 'var(--color-border)',
      }}
    >
      <div className="group cursor-pointer p-4" onClick={() => onToggleExpand(c.id)}>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span
                className="material-symbols-outlined text-sm text-text-muted transition-transform"
                style={{ transform: isExpanded ? 'rotate(90deg)' : '' }}
              >
                chevron_right
              </span>
              {c.category && (
                <span className="material-symbols-outlined text-sm" style={{ color: c.category.color }}>
                  {c.category.icon}
                </span>
              )}
              <h3 className="truncate font-semibold text-text-primary">{c.title}</h3>
              {isTemplate && c.version && (
                <span className="badge-version rounded-full bg-bg-surface-hover px-2 py-0.5 text-xs font-medium text-text-secondary">
                  v{c.version}
                </span>
              )}
              <span className="checklist-status-badge rounded-full px-2 py-0.5 text-xs font-medium" style={status.style}>
                {status.label}
              </span>
            </div>
            {c.description && <p className="ml-6 truncate text-sm text-text-muted">{c.description}</p>}
          </div>

          <div className="ml-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {isTemplate && onInstantiateTemplate && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onInstantiateTemplate(c)
                }}
                title="Create instance"
                className="checklist-action-btn checklist-action-btn-green rounded-lg p-1.5 text-text-muted transition-colors"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
              </button>
            )}
            {!isHistory && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(c)
                }}
                title="Edit"
                className="checklist-action-btn rounded-lg p-1.5 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
            )}
            {!isTemplate && !isHistory && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate(c.id)
                }}
                title="Duplicate"
                className="checklist-action-btn checklist-action-btn-copy rounded-lg p-1.5 text-text-muted transition-colors hover:text-primary"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
              </button>
            )}
            {!isTemplate && !isHistory && onArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onArchive(c.id)
                }}
                title="Archive"
                className="checklist-action-btn checklist-action-btn-amber rounded-lg p-1.5 text-text-muted transition-colors"
              >
                <span className="material-symbols-outlined text-sm">archive</span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(c.id)
              }}
              title="Delete"
              className="checklist-action-btn checklist-action-btn-danger rounded-lg p-1.5 text-text-muted transition-colors"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>

        <div className="ml-6 mt-3 flex items-center gap-3">
          <div className="checklist-progress-track h-2 flex-1 overflow-hidden rounded-full bg-bg-surface-hover">
            <div
              className="checklist-progress-fill h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: c.color }}
            />
          </div>
          <span className="w-16 text-right text-xs font-medium text-text-muted">
            {t('checklists.itemsCount', {
              completed: itemsList.filter((i) => i.completed).length,
              total: itemsList.length,
              progress,
            })}
          </span>
        </div>

        {/* History metrics */}
        {isHistory && metrics && (
          <div className="ml-6 mt-2 flex gap-3 text-xs text-text-muted">
            <span>{t('checklists.historyMetrics.items', { count: metrics.totalItems })}</span>
            <span>{t('checklists.historyMetrics.completed', { count: metrics.completedItems })}</span>
            <span>{t('checklists.historyMetrics.completion', { count: metrics.completionPercentage })}</span>
            {metrics.totalEffort > 0 && (
              <span>
                {t('checklists.historyMetrics.effort', {
                  hours: Math.floor(metrics.totalEffort / 60),
                  minutes: metrics.totalEffort % 60,
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {isExpanded && children}
    </div>
  )
}
