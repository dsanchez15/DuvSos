'use client'

import { Card } from '@/components/ui'
import ProgressRing from '@/components/ProgressRing'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { Goal } from '@/types/goal'

interface GoalProgressCardProps {
  goal: Goal
}

export default function GoalProgressCard({ goal }: GoalProgressCardProps) {
  const { t, language: lang } = useAppTranslation()

  const progress =
    goal.estimatedHours && goal.estimatedHours > 0
      ? Math.min(100, (goal.totalHoursSpent / goal.estimatedHours) * 100)
      : null

  const rows: { label: string; value: string }[] = [
    { label: t('goals.progress.timeInvested'), value: `${goal.totalHoursSpent.toFixed(1)}h` },
  ]
  if (goal.estimatedHours) {
    rows.push({ label: t('goals.progress.estimated'), value: `${goal.estimatedHours}h` })
  }
  if (goal.deadline) {
    rows.push({
      label: t('goals.progress.deadline'),
      value: new Date(goal.deadline).toLocaleDateString(lang === 'es' ? 'es' : 'en'),
    })
  }
  if (goal.phase) {
    rows.push({ label: t('goals.progress.phase'), value: `${goal.phase.number}. ${goal.phase.title}` })
  }

  return (
    <Card padding="lg" className="dashboard-card">
      <h3 className="mb-4 font-semibold text-text-primary">{t('goals.progress.title')}</h3>
      <div className="flex items-center gap-6">
        {progress !== null && <ProgressRing progress={progress} size={80} strokeWidth={8} />}
        <div className="flex-1 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-text-muted">{row.label}</span>
              <span className="text-text-primary">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
