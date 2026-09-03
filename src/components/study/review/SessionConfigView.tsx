'use client'

import { Button, Card } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { StudySessionConfig } from '@/types/study'

interface SessionConfigViewProps {
  config: StudySessionConfig
  topics: string[]
  maxQuestions: number
  filteredCount: number
  isConfigValid: boolean
  onConfigChange: (config: StudySessionConfig) => void
  onStart: () => void
}

function OptionChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[6px] border px-3 py-1.5 text-xs ${
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border'
      }`}
    >
      {children}
    </button>
  )
}

export default function SessionConfigView({
  config,
  topics,
  maxQuestions,
  filteredCount,
  isConfigValid,
  onConfigChange,
  onStart,
}: SessionConfigViewProps) {
  const { t } = useAppTranslation()

  const set = <K extends keyof StudySessionConfig>(key: K, value: StudySessionConfig[K]) =>
    onConfigChange({ ...config, [key]: value })

  const typeOptions = [
    { key: 'direct' as const, label: t('study.types.direct') },
    { key: 'multiple-choice' as const, label: t('study.types.multipleChoice') },
    { key: 'both' as const, label: t('study.types.both') },
  ]

  return (
    <div className="max-w-xl space-y-6">
      <Card padding="lg" className="space-y-5">
        <h2 className="text-lg font-semibold">{t('study.review.configTitle')}</h2>

        {/* Question count */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            {t('study.review.questionCount', { count: config.questionCount })}
          </label>
          <input
            type="range"
            min={1}
            max={maxQuestions}
            value={config.questionCount}
            onChange={(e) => set('questionCount', parseInt(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="mt-1 text-xs text-text-muted">{t('study.review.maxAllowed', { max: maxQuestions })}</p>
        </div>

        {/* Time limit */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            {t('study.review.timeLimitLabel')}
          </label>
          <div className="mb-2 flex gap-2">
            <OptionChip active={!config.timeLimit} onClick={() => onConfigChange({ ...config, timeLimit: null, timeLimitMode: null })}>
              {t('study.review.noLimit')}
            </OptionChip>
            <OptionChip
              active={config.timeLimitMode === 'per-question'}
              onClick={() => onConfigChange({ ...config, timeLimit: 30, timeLimitMode: 'per-question' })}
            >
              {t('study.review.perQuestion')}
            </OptionChip>
          </div>
          {config.timeLimitMode === 'per-question' && (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={config.timeLimit ?? 30}
                onChange={(e) => set('timeLimit', parseInt(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="w-16 text-right text-sm font-medium">{config.timeLimit}s</span>
            </div>
          )}
        </div>

        {/* Topics */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            {t('study.review.topicsLabel')}
          </label>
          <div className="flex flex-wrap gap-2">
            <OptionChip active={config.topics === 'all'} onClick={() => set('topics', 'all')}>
              {t('study.review.allTopics')}
            </OptionChip>
            {topics.map((topic) => {
              const selected = Array.isArray(config.topics) && config.topics.includes(topic)
              return (
                <OptionChip
                  key={topic}
                  active={selected}
                  onClick={() => {
                    const current = Array.isArray(config.topics) ? config.topics : []
                    const next = selected ? current.filter((x) => x !== topic) : [...current, topic]
                    set('topics', next.length ? next : 'all')
                  }}
                >
                  {topic}
                </OptionChip>
              )
            })}
          </div>
        </div>

        {/* Question type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            {t('study.review.questionTypeLabel')}
          </label>
          <div className="flex gap-2">
            {typeOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => set('questionType', opt.key)}
                className={`flex-1 rounded-[8px] border px-3 py-2 text-sm transition-all ${
                  config.questionType === opt.key ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-[8px] bg-bg-surface-hover p-3 text-sm">
          <p className="mb-1 font-medium">{t('study.review.summaryLabel')}</p>
          <p className="text-text-muted">
            {t('study.review.summaryText', {
              available: filteredCount,
              selected: config.questionCount,
              time: config.timeLimit
                ? t('study.review.timePerQuestion', { seconds: config.timeLimit })
                : t('study.review.noTimeLimit'),
            })}
          </p>
        </div>

        <Button fullWidth size="lg" onClick={onStart} disabled={!isConfigValid}>
          <span className="material-symbols-outlined text-sm">play_arrow</span>
          {t('study.review.startReview')}
        </Button>
        {!isConfigValid && (
          <p className="text-center text-xs text-danger">
            {filteredCount === 0
              ? t('study.review.noMatchingQuestions')
              : t('study.review.maxAvailable', { count: filteredCount })}
          </p>
        )}
      </Card>
    </div>
  )
}
