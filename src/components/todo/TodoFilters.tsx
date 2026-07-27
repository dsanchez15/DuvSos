'use client'

import { useState } from 'react'
import { Button, Input, Select } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { TodoCategory, ViewMode, GroupBy, FilterStatus } from '@/types/todo'

export interface TodoFiltersValue {
  viewMode: ViewMode
  groupBy: GroupBy
  search: string
  priority: string
  category: string
  status: FilterStatus
}

interface TodoFiltersProps {
  value: TodoFiltersValue
  categories: TodoCategory[]
  onChange: (value: TodoFiltersValue) => void
  onClear: () => void
}

const VIEW_MODES: ViewMode[] = ['all', 'today', 'week']

export default function TodoFilters({ value, categories, onChange, onClear }: TodoFiltersProps) {
  const { t } = useAppTranslation()
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters =
    value.search !== '' ||
    value.priority !== '' ||
    value.category !== '' ||
    value.status !== '' ||
    value.viewMode !== 'all' ||
    value.groupBy !== 'none'

  const set = <K extends keyof TodoFiltersValue>(key: K, v: TodoFiltersValue[K]) =>
    onChange({ ...value, [key]: v })

  return (
    <div className="space-y-2">
      <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>
        <span className="material-symbols-outlined text-sm">filter_list</span>
        {t('common.filter')}
        {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
      </Button>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode tabs */}
          <div role="tablist" className="flex rounded-[8px] bg-bg-surface-hover p-1">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode}
                role="tab"
                aria-selected={value.viewMode === mode}
                onClick={() => set('viewMode', mode)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  value.viewMode === mode
                    ? 'bg-bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary'
                }`}
              >
                {t(`todos.viewTabs.${mode}`)}
              </button>
            ))}
          </div>

          {/* Group By */}
          <Select
            fieldSize="sm"
            aria-label={t('todos.groupBy.none')}
            value={value.groupBy}
            onChange={(e) => set('groupBy', e.target.value as GroupBy)}
            className="w-auto"
          >
            <option value="none">{t('todos.groupBy.none')}</option>
            <option value="category">{t('todos.groupBy.category')}</option>
            <option value="priority">{t('todos.groupBy.priority')}</option>
            <option value="status">{t('todos.groupBy.status')}</option>
          </Select>

          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
              search
            </span>
            <Input
              fieldSize="sm"
              value={value.search}
              onChange={(e) => set('search', e.target.value)}
              placeholder={t('todos.searchPlaceholder')}
              aria-label={t('todos.searchPlaceholder')}
              className="pl-9 pr-9"
            />
            {value.search && (
              <button
                onClick={() => set('search', '')}
                aria-label={t('todos.clearFilters')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Priority */}
          <Select
            fieldSize="sm"
            aria-label={t('todos.priorities.all')}
            value={value.priority}
            onChange={(e) => set('priority', e.target.value)}
            className="w-auto"
          >
            <option value="">{t('todos.priorities.all')}</option>
            <option value="high">{t('todos.priorities.high')}</option>
            <option value="normal">{t('todos.priorities.normal')}</option>
            <option value="low">{t('todos.priorities.low')}</option>
          </Select>

          {/* Category */}
          <Select
            fieldSize="sm"
            aria-label={t('todos.form.category')}
            value={value.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-auto"
          >
            <option value="">{t('common.all')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>

          {/* Status */}
          <Select
            fieldSize="sm"
            aria-label={t('todos.statuses.all')}
            value={value.status}
            onChange={(e) => set('status', e.target.value as FilterStatus)}
            className="w-auto"
          >
            <option value="">{t('todos.statuses.all')}</option>
            <option value="pending">{t('todos.statuses.pending')}</option>
            <option value="completed">{t('todos.statuses.completed')}</option>
          </Select>

          {/* Clear */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClear} className="text-danger">
              {t('todos.clearFilters')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
