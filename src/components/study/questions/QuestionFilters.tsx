'use client'

import { Button, Input, Select } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { QuestionFilter } from '@/types/study'
import type { CategoryOption } from '@/hooks/useQuestions'

interface QuestionFiltersProps {
  filters: QuestionFilter
  searchQuery: string
  categories: CategoryOption[]
  topics: string[]
  onFiltersChange: (filters: QuestionFilter) => void
  onSearchChange: (query: string) => void
  onApplySearch: () => void
  onClear: () => void
}

export default function QuestionFilters({
  filters,
  searchQuery,
  categories,
  topics,
  onFiltersChange,
  onSearchChange,
  onApplySearch,
  onClear,
}: QuestionFiltersProps) {
  const { t } = useAppTranslation()

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="flex min-w-[200px] flex-1 gap-2">
        <div className="flex-1">
          <Input
            label={t('study.questions.searchLabel')}
            fieldSize="sm"
            placeholder={t('study.questions.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onApplySearch()
            }}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onApplySearch}
          title={t('study.questions.searchLabel')}
          aria-label={t('study.questions.searchLabel')}
          className="h-9 w-9 shrink-0 self-end border border-border !px-0"
        >
          <span className="material-symbols-outlined text-base">search</span>
        </Button>
      </div>

      <Select
        label={t('study.questions.categoryLabel')}
        fieldSize="sm"
        value={filters.categoryId ?? ''}
        onChange={(e) =>
          onFiltersChange({ ...filters, categoryId: e.target.value ? parseInt(e.target.value) : null })
        }
        className="w-auto"
      >
        <option value="">{t('study.questions.allFem')}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select
        label={t('study.questions.topicLabel')}
        fieldSize="sm"
        value={filters.topic ?? ''}
        onChange={(e) => onFiltersChange({ ...filters, topic: e.target.value || null })}
        className="w-auto"
      >
        <option value="">{t('study.questions.allFem')}</option>
        {topics.map((topic) => (
          <option key={topic} value={topic}>
            {topic}
          </option>
        ))}
      </Select>

      <Select
        label={t('study.questions.typeLabel')}
        fieldSize="sm"
        value={filters.mode ?? ''}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            mode: (e.target.value as 'direct' | 'multiple-choice' | 'dual') || null,
          })
        }
        className="w-auto"
      >
        <option value="">{t('study.questions.allMasc')}</option>
        <option value="direct">{t('study.types.direct')}</option>
        <option value="multiple-choice">{t('study.types.multipleChoice')}</option>
        <option value="dual">{t('study.types.dual')}</option>
      </Select>

      <Button variant="secondary" size="sm" onClick={onClear} className="border border-border text-text-muted">
        {t('study.questions.clear')}
      </Button>
    </div>
  )
}
