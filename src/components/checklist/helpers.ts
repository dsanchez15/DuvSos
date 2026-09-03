import { t } from '@/lib/i18n'
import { isExpired, daysRemaining } from '@/lib/checklist-utils'
import type { Checklist, ChecklistFilter, Priority } from '@/types/checklist'

export const priorityConfig: Record<Priority, { icon: string; color: string }> = {
  high: { icon: 'arrow_upward', color: 'var(--color-danger)' },
  normal: { icon: 'remove', color: 'var(--color-text-muted)' },
  low: { icon: 'arrow_downward', color: 'var(--color-info)' },
}

export type SortOption = 'newest' | 'name' | 'progress' | 'due-date'

export interface ChecklistStatus {
  key: string
  label: string
  style: React.CSSProperties
}

export function getStatus(c: Checklist): ChecklistStatus {
  const successStyle: React.CSSProperties = { background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }
  const mutedStyle: React.CSSProperties = { background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-secondary)' }
  const dangerStyle: React.CSSProperties = { background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }
  const warningStyle: React.CSSProperties = { background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }
  const infoStyle: React.CSSProperties = { background: 'color-mix(in srgb, var(--color-info) 15%, transparent)', color: 'var(--color-info)' }

  if (c.lifecycleState === 'Completed') return { key: 'completed', label: t('checklists.status.completed'), style: successStyle }
  if (c.lifecycleState === 'Archived') return { key: 'archived', label: t('checklists.status.archived'), style: mutedStyle }
  if (!c.startDate && !c.endDate) return { key: 'no-dates', label: t('checklists.status.noDates'), style: mutedStyle }
  const now = new Date()
  const end = c.endDate ? new Date(c.endDate) : null
  const start = c.startDate ? new Date(c.startDate) : null
  if (end && isExpired(end)) return { key: 'expired', label: t('checklists.status.expired'), style: dangerStyle }
  if (end) {
    const days = daysRemaining(end)
    if (days <= 3) return { key: 'days-left', label: t('checklists.status.daysLeft', { count: days }), style: warningStyle }
  }
  if (start && start > now) return { key: 'upcoming', label: t('checklists.status.upcoming'), style: infoStyle }
  return { key: 'active', label: t('checklists.status.active'), style: successStyle }
}

export function getProgress(c: Checklist): number {
  const items = Array.isArray(c.items) ? c.items : []
  if (items.length === 0) return 0
  return Math.round((items.filter((i) => i.completed).length / items.length) * 100)
}

export function getTotalEffort(c: Checklist): number {
  const items = Array.isArray(c.items) ? c.items : []
  return items.reduce((sum, i) => sum + (i.effortEstimate || 0), 0)
}

export function getOverallPriority(c: Checklist): Priority {
  const items = Array.isArray(c.items) ? c.items : []
  if (items.some((i) => i.priority === 'high')) return 'high'
  if (items.some((i) => i.priority === 'normal')) return 'normal'
  return 'low'
}

export const filterOptions: { value: ChecklistFilter; label: string }[] = [
  { value: 'all', label: t('checklists.filters.all') },
  { value: 'active', label: t('checklists.filters.active') },
  { value: 'expired', label: t('checklists.filters.expired') },
  { value: 'no-dates', label: t('checklists.filters.noDates') },
]

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: t('checklists.sort.newest') },
  { value: 'name', label: t('checklists.sort.name') },
  { value: 'progress', label: t('checklists.sort.progress') },
  { value: 'due-date', label: t('checklists.sort.dueDate') },
]
