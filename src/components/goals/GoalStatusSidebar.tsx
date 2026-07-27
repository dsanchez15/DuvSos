'use client'

import { Badge, Card } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { Goal, GoalStatus } from '@/types/goal'

interface GoalPermissions {
  canEdit: boolean
  canDelete: boolean
  canActivate: boolean
  canPause: boolean
  canComplete: boolean
  canChangeStatus: boolean
}

interface GoalStatusSidebarProps {
  goal: Goal
  permissions: GoalPermissions
  saving: boolean
  isEditing: boolean
  onStatusChange: (status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PAUSED') => void
  onEdit: () => void
  onDelete: () => void
}

const STATUS_VARIANTS: Record<GoalStatus, 'neutral' | 'success' | 'info' | 'warning' | 'danger'> = {
  PENDING: 'neutral',
  ACTIVE: 'success',
  COMPLETED: 'info',
  PAUSED: 'warning',
  CANCELLED: 'danger',
}

export default function GoalStatusSidebar({
  goal,
  permissions,
  saving,
  isEditing,
  onStatusChange,
  onEdit,
  onDelete,
}: GoalStatusSidebarProps) {
  const { t } = useAppTranslation()

  return (
    <Card padding="lg" className="dashboard-card">
      <h3 className="mb-4 font-semibold text-text-primary">{t('goals.statusLabel')}</h3>
      <div className="space-y-2">
        <Badge variant={STATUS_VARIANTS[goal.status]} className="px-3 py-1 text-sm">
          {t(`goals.status.${goal.status.toLowerCase()}`)}
        </Badge>
      </div>

      {permissions.canEdit && !isEditing && (
        <div className="mt-4 rounded-[8px] bg-warning/10 p-3 text-xs text-warning">
          {t('goals.alerts.noProgress')}
        </div>
      )}

      {!isEditing && permissions.canChangeStatus && (
        <div className="mt-4 space-y-2">
          {permissions.canActivate && (
            <button
              onClick={() => onStatusChange('ACTIVE')}
              disabled={saving}
              className="w-full rounded-[8px] border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-primary/5"
            >
              {t('goals.actions.activate')}
            </button>
          )}
          {permissions.canPause && (
            <button
              onClick={() => onStatusChange('PAUSED')}
              disabled={saving}
              className="w-full rounded-[8px] border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-primary/5"
            >
              {t('goals.actions.pause')}
            </button>
          )}
          {permissions.canComplete && (
            <button
              onClick={() => onStatusChange('COMPLETED')}
              disabled={saving}
              className="w-full rounded-[8px] border border-border px-3 py-2 text-sm text-success transition-colors hover:bg-success/10"
            >
              {t('goals.actions.complete')}
            </button>
          )}
        </div>
      )}

      {!isEditing && (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {permissions.canEdit && (
            <button
              onClick={onEdit}
              className="w-full rounded-[8px] px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-primary/5"
            >
              {t('goals.actions.editGoal')}
            </button>
          )}
          {permissions.canDelete && (
            <button
              onClick={onDelete}
              className="w-full rounded-[8px] px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
            >
              {t('goals.actions.deleteGoal')}
            </button>
          )}
        </div>
      )}
    </Card>
  )
}
