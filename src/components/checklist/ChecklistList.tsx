'use client'

import { useState, useCallback } from 'react'
import { Button, EmptyState, Input, Select } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import ChecklistCard from './ChecklistCard'
import ExpandedItems from './ExpandedItems'
import UndoToast from './UndoToast'
import { filterOptions, sortOptions, getStatus, getProgress, type SortOption } from './helpers'
import type {
  Checklist,
  ChecklistCategory,
  ChecklistFilter,
  ChecklistItem,
  ChecklistTab,
  Priority,
} from '@/types/checklist'

export type { SortOption }

interface Props {
  tab: ChecklistTab
  checklists: Checklist[]
  categories: ChecklistCategory[]
  filter: ChecklistFilter
  categoryFilter: number | null
  expandedId: number | null
  search: string
  sort: SortOption
  onTabChange: (tab: ChecklistTab) => void
  onSearchChange: (s: string) => void
  onSortChange: (s: SortOption) => void
  onFilterChange: (f: ChecklistFilter) => void
  onCategoryFilterChange: (id: number | null) => void
  onToggleExpand: (id: number) => void
  onEdit: (c: Checklist) => void
  onNew: () => void
  onDuplicate: (id: number) => void
  onDelete: (id: number) => void
  onArchive?: (id: number) => void
  onInstantiateTemplate?: (template: Checklist) => void
  onToggleItem: (checklistId: number, item: ChecklistItem) => void
  onAddItem: (checklistId: number, title: string, priority: Priority, parentId?: number | null) => void
  onUpdateItem: (checklistId: number, item: ChecklistItem, data: Partial<ChecklistItem>) => void
  onDeleteItem: (checklistId: number, itemId: number) => void
  onReorder: (checklistId: number, items: ChecklistItem[]) => Promise<void>
  onCreateReminder: (checklistId: number, item: ChecklistItem) => void
}

export default function ChecklistList({
  tab,
  checklists,
  categories,
  filter,
  categoryFilter,
  expandedId,
  search,
  sort,
  onTabChange,
  onSearchChange,
  onSortChange,
  onFilterChange,
  onCategoryFilterChange,
  onToggleExpand,
  onEdit,
  onNew,
  onDuplicate,
  onDelete,
  onArchive,
  onInstantiateTemplate,
  onToggleItem,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorder,
  onCreateReminder,
}: Props) {
  const { t } = useAppTranslation()
  const [undoChecklist, setUndoChecklist] = useState<{ checklist: Checklist; timer: NodeJS.Timeout } | null>(null)

  const handleDelete = (id: number) => {
    const cl = checklists.find((c) => c.id === id)
    if (!cl) return
    if (undoChecklist) {
      clearTimeout(undoChecklist.timer)
      onDelete(undoChecklist.checklist.id)
    }
    const timer = setTimeout(() => {
      onDelete(id)
      setUndoChecklist(null)
    }, 5000)
    setUndoChecklist({ checklist: cl, timer })
  }

  const handleUndo = () => {
    if (!undoChecklist) return
    clearTimeout(undoChecklist.timer)
    setUndoChecklist(null)
  }

  const dismissUndo = useCallback(() => {
    if (!undoChecklist) return
    clearTimeout(undoChecklist.timer)
    onDelete(undoChecklist.checklist.id)
    setUndoChecklist(null)
  }, [undoChecklist, onDelete])

  const filtered = checklists
    .filter((c) => {
      if (undoChecklist && c.id === undoChecklist.checklist.id) return false
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
      if (categoryFilter && c.categoryId !== categoryFilter) return false
      if (tab === 'templates') return true
      if (tab === 'history') return true
      if (filter === 'all') return true
      const statusKey = getStatus(c).key
      if (filter === 'active') return statusKey === 'active' || statusKey === 'days-left' || statusKey === 'upcoming'
      if (filter === 'expired') return statusKey === 'expired'
      if (filter === 'no-dates') return statusKey === 'no-dates'
      return true
    })
    .sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title)
      if (sort === 'progress') return getProgress(b) - getProgress(a)
      if (sort === 'due-date') {
        const aEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity
        const bEnd = b.endDate ? new Date(b.endDate).getTime() : Infinity
        return aEnd - bEnd
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const tabLabels: { value: ChecklistTab; label: string }[] = [
    { value: 'active', label: t('checklists.tabs.active') },
    { value: 'templates', label: t('checklists.tabs.templates') },
    { value: 'history', label: t('checklists.tabs.history') },
  ]

  const emptyTitle = search
    ? t('checklists.noResults')
    : tab === 'templates'
      ? t('checklists.noTemplates')
      : tab === 'history'
        ? t('checklists.noHistory')
        : t('checklists.noChecklists')

  const emptyDescription = search
    ? t('checklists.tryDifferentSearch')
    : tab === 'templates'
      ? t('checklists.createTemplateHint')
      : tab === 'history'
        ? t('checklists.archiveHint')
        : t('checklists.createHint')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('checklists.title')}</h2>
          <p className="mt-1 text-text-muted">{t('checklists.checklistCount', { count: checklists.length })}</p>
        </div>
        <Button onClick={onNew}>
          <span className="material-symbols-outlined text-sm">add</span>
          {t('checklists.newChecklist')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="checklist-tabs flex gap-1 border-b border-border pb-1">
        {tabLabels.map((tabItem) => (
          <button
            key={tabItem.value}
            onClick={() => onTabChange(tabItem.value)}
            data-active={tab === tabItem.value}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === tabItem.value
                ? 'border-b-2 border-primary bg-primary/5 text-primary'
                : 'checklist-tab-inactive text-text-muted'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
          search
        </span>
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('checklists.searchPlaceholder')}
          aria-label={t('checklists.searchPlaceholder')}
          className="pl-10"
        />
      </div>

      {/* Filters + Sort */}
      {tab === 'active' && (
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={`checklist-filter-btn rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'checklist-filter-btn-active bg-primary text-white'
                  : 'checklist-filter-btn-inactive bg-bg-surface-hover text-text-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
          {categories.length > 0 && (
            <Select
              fieldSize="sm"
              value={categoryFilter ?? ''}
              onChange={(e) => onCategoryFilterChange(e.target.value ? parseInt(e.target.value) : null)}
              aria-label={t('common.all')}
              className="w-auto border-0 bg-bg-surface-hover text-text-secondary"
            >
              <option value="">{t('common.all')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          )}
          <div className="ml-auto flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-text-muted">sort</span>
            <Select
              fieldSize="sm"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label={t('checklists.sort.newest')}
              className="w-auto border-0 bg-bg-surface-hover text-text-secondary"
            >
              {sortOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon="fact_check" title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-3">
          {filtered.map((c) => (
            <ChecklistCard
              key={c.id}
              checklist={c}
              isExpanded={expandedId === c.id}
              isTemplate={tab === 'templates'}
              isHistory={tab === 'history'}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={handleDelete}
              onArchive={onArchive}
              onInstantiateTemplate={onInstantiateTemplate}
            >
              <ExpandedItems
                checklist={c}
                onToggleItem={onToggleItem}
                onUpdateItem={onUpdateItem}
                onDeleteItem={onDeleteItem}
                onAddItem={onAddItem}
                onReorder={onReorder}
                onCreateReminder={onCreateReminder}
                mode={tab === 'history' ? 'history' : tab === 'templates' ? 'template' : 'active'}
              />
            </ChecklistCard>
          ))}
        </div>
      )}

      {undoChecklist && (
        <UndoToast
          message={t('checklists.expandedItems.deleted', { title: undoChecklist.checklist.title })}
          onUndo={handleUndo}
          onClose={dismissUndo}
        />
      )}
    </div>
  )
}
