'use client'

import { Button, Card } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { SessionResult } from '@/types/study'

interface SessionSummaryViewProps {
  result: SessionResult
  previousResult: SessionResult | null
  onNewSession: () => void
}

function DeltaRow({ delta, label, invert = false, suffix = '' }: { delta: number; label: string; invert?: boolean; suffix?: string }) {
  const isGood = invert ? delta <= 0 : delta >= 0
  const icon = invert
    ? delta <= 0
      ? 'trending_down'
      : 'trending_up'
    : delta >= 0
      ? 'trending_up'
      : 'trending_down'
  return (
    <div className="flex items-center gap-2">
      <span
        className="material-symbols-outlined text-sm"
        style={{ color: isGood ? 'var(--color-success)' : 'var(--color-danger)' }}
      >
        {icon}
      </span>
      <span>
        {label}: {delta >= 0 ? '+' : ''}
        {delta}
        {suffix}
      </span>
    </div>
  )
}

export default function SessionSummaryView({ result, previousResult, onNewSession }: SessionSummaryViewProps) {
  const { t } = useAppTranslation()

  const accuracy = result.accuracyPercentage
  const iconConfig =
    accuracy >= 70
      ? { icon: 'emoji_events', classes: 'bg-success/10 text-success' }
      : accuracy >= 40
        ? { icon: 'sentiment_neutral', classes: 'bg-warning/10 text-warning' }
        : { icon: 'sentiment_dissatisfied', classes: 'bg-danger/10 text-danger' }

  const stats = [
    { value: result.correctCount, valueClass: 'text-success', label: t('study.review.correctCount') },
    { value: result.incorrectCount, valueClass: 'text-danger', label: t('study.review.incorrectCount') },
    { value: `${result.accuracyPercentage}%`, valueClass: 'text-primary', label: t('study.review.accuracy') },
  ]

  return (
    <div className="mx-auto max-w-md">
      <Card padding="lg" className="text-center">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconConfig.classes}`}>
          <span className="material-symbols-outlined text-3xl">{iconConfig.icon}</span>
        </div>
        <h2 className="mb-1 text-xl font-bold">{t('study.review.sessionComplete')}</h2>
        <p className="mb-6 text-sm text-text-muted">
          {t('study.review.questionsAnswered', { count: result.totalQuestions })}
        </p>

        <div className="mb-6 grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[8px] bg-bg-surface-hover p-3">
              <p className={`text-2xl font-bold ${stat.valueClass}`}>{stat.value}</p>
              <p className="text-xs text-text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        {previousResult && (
          <div className="mb-6 rounded-[8px] bg-bg-surface-hover p-3 text-left">
            <p className="mb-2 text-sm font-medium">{t('study.review.comparisonTitle')}</p>
            <div className="space-y-1 text-sm">
              <DeltaRow delta={result.correctCount - previousResult.correctCount} label={t('study.review.correctCount')} />
              <DeltaRow
                delta={result.incorrectCount - previousResult.incorrectCount}
                label={t('study.review.incorrectCount')}
                invert
              />
              <DeltaRow
                delta={result.accuracyPercentage - previousResult.accuracyPercentage}
                label={t('study.review.accuracy')}
                suffix="%"
              />
            </div>
          </div>
        )}

        <Button fullWidth size="lg" onClick={onNewSession}>
          {t('study.review.newSession')}
        </Button>
      </Card>
    </div>
  )
}
