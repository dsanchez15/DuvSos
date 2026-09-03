'use client'

import { Button, Card } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { StudySession } from '@/types/study'

interface ResumeSessionBannerProps {
  session: StudySession | null
  onResume: () => void
  onDiscard: () => void
}

export default function ResumeSessionBanner({ session, onResume, onDiscard }: ResumeSessionBannerProps) {
  const { t } = useAppTranslation()

  return (
    <Card className="mb-6">
      <p className="mb-2 font-medium">{t('study.review.resumeTitle')}</p>
      <p className="mb-3 text-sm text-text-muted">
        {t('study.review.resumeProgress', {
          answered: session?.answers.length ?? 0,
          total: session?.questionIds.length ?? 0,
        })}
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onResume}>
          {t('study.review.resumeButton')}
        </Button>
        <Button size="sm" variant="secondary" onClick={onDiscard} className="border border-border">
          {t('study.review.discardButton')}
        </Button>
      </div>
    </Card>
  )
}
