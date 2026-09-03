'use client'

import { Button, Card, Input } from '@/components/ui'
import { formatTime } from '@/lib/date-utils'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { Question, QuestionType, StudySession } from '@/types/study'

interface ActiveSessionViewProps {
  session: StudySession
  question: Question
  mode: QuestionType
  timeLeft: number | null
  userAnswer: string
  selectedOption: number | null
  showFeedback: boolean
  isCorrect: boolean
  onUserAnswerChange: (value: string) => void
  onSelectOption: (index: number) => void
  onSubmit: () => void
  onContinue: () => void
  onAbandon: () => void
}

export default function ActiveSessionView({
  session,
  question,
  mode,
  timeLeft,
  userAnswer,
  selectedOption,
  showFeedback,
  isCorrect,
  onUserAnswerChange,
  onSelectOption,
  onSubmit,
  onContinue,
  onAbandon,
}: ActiveSessionViewProps) {
  const { t } = useAppTranslation()

  const progress =
    session.questionIds.length > 0 ? (session.currentIndex / session.questionIds.length) * 100 : 0

  const correctAnswerText =
    mode === 'direct'
      ? question.directAnswer
      : question.correctOptionIndex !== null
        ? question.options[question.correctOptionIndex]
        : ''

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress & Timer */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {session.currentIndex + 1} / {session.questionIds.length}
          </span>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-bg-surface-hover">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {timeLeft !== null && (
          <span className={`font-mono text-sm font-bold ${timeLeft <= 10 ? 'text-danger' : ''}`}>
            {formatTime(timeLeft)}
          </span>
        )}
        <button
          onClick={onAbandon}
          className="rounded-[6px] border border-border px-2 py-1 text-xs text-danger hover:bg-danger/10"
        >
          {t('study.review.abandon')}
        </button>
      </div>

      {/* Question Card */}
      <Card padding="lg">
        <p className="mb-6 text-lg font-medium">{question.question}</p>

        {!showFeedback ? (
          mode === 'direct' ? (
            <div className="space-y-3">
              <Input
                value={userAnswer}
                onChange={(e) => onUserAnswerChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                placeholder={t('study.review.answerPlaceholder')}
                aria-label={t('study.review.answerPlaceholder')}
                autoFocus
                className="py-3 text-base"
              />
              <Button fullWidth size="lg" onClick={onSubmit} disabled={!userAnswer.trim()}>
                {t('study.review.answer')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {question.options
                .filter((o) => o.trim())
                .map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectOption(i)}
                    className={`w-full rounded-[8px] border px-4 py-3 text-left text-sm transition-all ${
                      selectedOption === i
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-bg-input'
                    }`}
                  >
                    <span className="mr-2 font-bold">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                ))}
              <Button fullWidth size="lg" onClick={onSubmit} disabled={selectedOption === null} className="mt-2">
                {t('study.review.answer')}
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div
              className={`rounded-[8px] p-4 ${isCorrect ? 'bg-success/10' : 'bg-danger/10'}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`material-symbols-outlined ${isCorrect ? 'text-success' : 'text-danger'}`}>
                  {isCorrect ? 'check_circle' : 'cancel'}
                </span>
                <span className={`font-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>
                  {isCorrect ? t('study.review.correct') : t('study.review.incorrect')}
                </span>
              </div>
              {!isCorrect && (
                <p className="text-sm text-text-secondary">
                  {t('study.review.correctAnswerLabel')}{' '}
                  <span className="font-medium">{correctAnswerText}</span>
                </p>
              )}
            </div>
            <Button fullWidth size="lg" onClick={onContinue}>
              {t('study.review.continue')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
