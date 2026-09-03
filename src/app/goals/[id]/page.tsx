'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { Spinner } from '@/components/ui'
import PriorityBadge from '@/components/PriorityBadge'
import { useAppTranslation } from '@/components/LanguageProvider'
import { useGoal } from '@/hooks/useGoal'
import GoalProgressCard from '@/components/goals/GoalProgressCard'
import GoalMilestonesCard from '@/components/goals/GoalMilestonesCard'
import GoalEditForm from '@/components/goals/GoalEditForm'
import GoalStatusSidebar from '@/components/goals/GoalStatusSidebar'

export default function GoalDetailPage() {
  const { t, language: lang, setLanguage } = useAppTranslation()
  const params = useParams()
  const router = useRouter()
  const goalId = params.id as string

  const {
    goal,
    loading,
    error,
    saving,
    phases,
    permissions,
    setError,
    toggleMilestone,
    changeStatus,
    deleteGoal,
    saveEdit,
  } = useGoal(goalId, t)

  const [isEditing, setIsEditing] = useState(false)

  const handleDelete = async () => {
    if (!goal) return
    if (!confirm(t('common.confirm'))) return
    const success = await deleteGoal()
    if (success) {
      router.push('/goals')
    } else {
      alert(t('common.error'))
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  if (!goal || !permissions) {
    return (
      <AppLayout>
        <div className="py-12 text-center">
          <p className="mb-2 text-lg text-text-primary">{t('goals.notFound')}</p>
          <Link href="/goals" className="text-primary hover:underline">
            {t('common.back')}
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Language toggle */}
        <div className="flex justify-end gap-2">
          {(['es', 'en'] as const).map((code) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`rounded-[8px] px-3 py-1 text-xs font-medium transition-colors ${
                lang === code ? 'bg-primary text-white' : 'border border-border text-text-secondary'
              }`}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>

        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/goals" className="rounded-[8px] p-2 text-text-muted hover:bg-primary/10">
              ←
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {isEditing ? t('goals.actions.editGoal') : goal.title}
              </h1>
              {!isEditing && goal.description && (
                <p className="mt-1 text-text-secondary">{goal.description}</p>
              )}
            </div>
          </div>
          {!isEditing && <PriorityBadge priority={goal.priority} />}
        </header>

        {error && (
          <div className="rounded-[8px] bg-danger/10 p-4 text-danger">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {!isEditing ? (
              <>
                <GoalProgressCard goal={goal} />
                <GoalMilestonesCard
                  goal={goal}
                  canCheck={permissions.canCheckMilestones}
                  onToggle={toggleMilestone}
                />
              </>
            ) : (
              <GoalEditForm
                goal={goal}
                phases={phases}
                saving={saving}
                onSave={saveEdit}
                onCancel={() => {
                  setIsEditing(false)
                  setError('')
                }}
              />
            )}
          </div>

          <div className="space-y-6">
            <GoalStatusSidebar
              goal={goal}
              permissions={permissions}
              saving={saving}
              isEditing={isEditing}
              onStatusChange={changeStatus}
              onEdit={() => setIsEditing(true)}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
