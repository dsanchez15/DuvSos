'use client'

import type { Category, ViewMode, GroupBy, FilterStatus } from '@/types/todo'
import { useAppTranslation } from '@/components/LanguageProvider'
import { useRef } from 'react'

interface TodoFiltersProps {
  viewMode: ViewMode
  groupBy: GroupBy
  searchQuery: string
  filterPriority: string
  filterCategory: string
  filterStatus: FilterStatus
  categories: Category[]
  hasActiveFilters: boolean
  showFilters: boolean
  onViewModeChange: (mode: ViewMode) => void
  onGroupByChange: (group: GroupBy) => void
  onSearchChange: (query: string) => void
  onPriorityChange: (priority: string) => void
  onCategoryChange: (category: string) => void
  onStatusChange: (status: FilterStatus) => void
  onClearFilters: () => void
  onToggleFilters: () => void
  onClearSearch: () => void
}

export default function TodoFilters({
  viewMode,
  groupBy,
  searchQuery,
  filterPriority,
  filterCategory,
  filterStatus,
  categories,
  hasActiveFilters,
  showFilters,
  onViewModeChange,
  onGroupByChange,
  onSearchChange,
  onPriorityChange,
  onCategoryChange,
  onStatusChange,
  onClearFilters,
  onToggleFilters,
  onClearSearch,
}: TodoFiltersProps) {
  const { t } = useAppTranslation()
  const searchRef = useRef<HTMLInputElement>(null)

  return (
    <>
      {/* Filters Toggle */}
      <button
        onClick={onToggleFilters}
        className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm font-medium transition-colors todo-bg-surface-hover todo-text-secondary todo-border"
        aria-expanded={showFilters}
        aria-controls="todo-filters-panel"
      >
        <span className="material-symbols-outlined text-sm">filter_list</span>
        {t('common.filter')}
        {hasActiveFilters && (
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--color-primary)' }}
          />
        )}
      </button>

      {/* Filters Bar */}
      {showFilters && (
        <div id="todo-filters-panel" className="flex flex-wrap gap-2 items-center" role="search">
          {/* View Mode */}
          <div
            className="todo-view-tabs flex rounded-[8px] p-1 todo-bg-surface-hover"
            role="tablist"
            aria-label={t('todos.viewTabs.label') || 'View mode'}
          >
            {(['all', 'today', 'week'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                role="tab"
                aria-selected={viewMode === mode}
                data-active={viewMode === mode}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  viewMode === mode ? 'shadow-sm' : ''
                } ${viewMode === mode ? 'todo-text-primary' : 'todo-text-secondary'}`}
                style={{
                  background: viewMode === mode ? 'var(--color-bg-surface)' : 'transparent',
                }}
              >
                {t(`todos.viewTabs.${mode}`)}
              </button>
            ))}
          </div>

          {/* Group By */}
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
            className="todo-select todo-input-sm"
            aria-label={t('todos.groupBy.label') || 'Group by'}
          >
            <option value="none">{t('todos.groupBy.none')}</option>
            <option value="category">{t('todos.groupBy.category')}</option>
            <option value="priority">{t('todos.groupBy.priority')}</option>
            <option value="status">{t('todos.groupBy.status')}</option>
          </select>

          {/* Search with clear */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm todo-text-muted">search</span>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('todos.searchPlaceholder')}
              className="todo-input-sm w-full pl-9 pr-9 py-2"
              aria-label={t('todos.searchPlaceholder')}
            />
            {searchQuery && (
              <button
                onClick={() => { onClearSearch(); searchRef.current?.focus() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 todo-search-clear"
                aria-label={t('common.clear') || 'Clear search'}
              >
                <span className="material-symbols-outlined text-sm todo-text-muted">close</span>
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="todo-select todo-input-sm"
            aria-label={t('todos.priorities.label') || 'Filter by priority'}
          >
            <option value="">{t('todos.priorities.all')}</option>
            <option value="high">{t('todos.priorities.high')}</option>
            <option value="normal">{t('todos.priorities.normal')}</option>
            <option value="low">{t('todos.priorities.low')}</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="todo-select todo-input-sm"
            aria-label={t('todos.filterByCategory') || 'Filter by category'}
          >
            <option value="">{t('common.all')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => onStatusChange(e.target.value as FilterStatus)}
            className="todo-select todo-input-sm"
            aria-label={t('todos.filterByStatus') || 'Filter by status'}
          >
            <option value="">{t('todos.statuses.all')}</option>
            <option value="pending">{t('todos.statuses.pending')}</option>
            <option value="completed">{t('todos.statuses.completed')}</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="todo-clear-filters px-3 py-2 text-sm rounded-[8px] transition-colors"
              style={{ color: 'var(--color-danger)' }}
            >
              {t('todos.clearFilters')}
            </button>
          )}
        </div>
      )}
    </>
  )
}