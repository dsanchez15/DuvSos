'use client'

import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { useAppTranslation } from '@/components/LanguageProvider'

type Priority = 'ALTA' | 'MEDIA' | 'BAJA'

interface PriorityBadgeProps {
  priority: Priority
}

const PRIORITY_VARIANTS: Record<Priority, BadgeVariant> = {
  ALTA: 'danger',
  MEDIA: 'warning',
  BAJA: 'success',
}

const PRIORITY_KEYS: Record<Priority, string> = {
  ALTA: 'goals.priorityHigh',
  MEDIA: 'goals.priorityMedium',
  BAJA: 'goals.priorityLow',
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { t } = useAppTranslation()

  const variant = PRIORITY_VARIANTS[priority] ?? 'warning'
  const labelKey = PRIORITY_KEYS[priority] ?? PRIORITY_KEYS.MEDIA

  return <Badge variant={variant}>{t(labelKey)}</Badge>
}
