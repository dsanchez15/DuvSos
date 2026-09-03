'use client'

import { Card } from '@/components/ui'
import MilestoneItem from '@/components/MilestoneItem'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { Goal } from '@/types/goal'

interface GoalMilestonesCardProps {
  goal: Goal
  canCheck: boolean
  onToggle: (milestoneId: string, completed: boolean) => void
}

export default function GoalMilestonesCard({ goal, canCheck, onToggle }: GoalMilestonesCardProps) {
  const { t } = useAppTranslation()

  const milestones = goal.milestones ?? []
  const completedCount = milestones.filter((m) => m.completed).length

  return (
    <Card padding="lg" className="dashboard-card">
      <h3 className="mb-4 font-semibold text-text-primary">
        {t('goals.milestones')} ({completedCount}/{milestones.length})
      </h3>
      {milestones.length > 0 ? (
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              onToggle={canCheck ? onToggle : undefined}
              readOnly={!canCheck}
            />
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-text-muted">{t('goals.noMilestones')}</p>
      )}
      {!canCheck && milestones.length > 0 && (
        <p className="mt-3 text-xs text-text-muted">
          {goal.status === 'PAUSED'
            ? t('goals.alerts.pausedNoCheck')
            : goal.status === 'PENDING'
              ? t('goals.alerts.pendingNoComplete')
              : t('goals.alerts.completedLocked')}
        </p>
      )}
    </Card>
  )
}
