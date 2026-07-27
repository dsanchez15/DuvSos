'use client'

import { Badge } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { Question } from '@/types/study'
import type { CategoryOption } from '@/hooks/useQuestions'

interface QuestionCardProps {
  question: Question
  categories: CategoryOption[]
  onEdit: (question: Question) => void
  onDelete: (id: string) => void
}

export default function QuestionCard({ question: q, categories, onEdit, onDelete }: QuestionCardProps) {
  const { t } = useAppTranslation()

  return (
    <div className="flex items-start justify-between gap-4 rounded-[8px] border border-border bg-bg-surface p-4">
      <div className="min-w-0 flex-1">
        <p className="mb-1 truncate text-sm font-medium">{q.question}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="primary">{q.topic?.name || ''}</Badge>
          {q.categoryId !== null && (
            <Badge>{categories.find((c) => c.id === q.categoryId)?.name ?? 'General'}</Badge>
          )}
          <Badge>{q.type === 'direct' ? t('study.types.direct') : t('study.types.multipleChoice')}</Badge>
          {q.supportsBothModes && <Badge variant="success">{t('study.types.dual')}</Badge>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => onEdit(q)}
          className="rounded-[6px] p-2 text-text-muted transition-colors hover:bg-primary/10"
          aria-label={t('common.edit')}
        >
          <span className="material-symbols-outlined text-sm">edit</span>
        </button>
        <button
          onClick={() => onDelete(q.id)}
          className="rounded-[6px] p-2 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          aria-label={t('common.delete')}
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    </div>
  )
}
