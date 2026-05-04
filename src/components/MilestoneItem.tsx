'use client'

import { useState } from 'react'
import { Milestone } from '@/types/goal'

interface MilestoneItemProps {
  milestone: Milestone
  onToggle?: (id: string, completed: boolean) => void
  readOnly?: boolean
}

export default function MilestoneItem({ milestone, onToggle, readOnly }: MilestoneItemProps) {
  const [loading, setLoading] = useState(false)

  const isOverdue = milestone.targetDate &&
    !milestone.completed &&
    new Date(milestone.targetDate) < new Date()

  const handleToggle = async () => {
    if (!onToggle || readOnly) return
    setLoading(true)
    try {
      await onToggle(milestone.id, !milestone.completed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        milestone.completed ? 'opacity-60' : ''
      }`}
      style={{
        background: milestone.completed ? 'var(--color-bg-surface)' : 'transparent',
        borderColor: isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--color-border)',
      }}
    >
      <button
        onClick={handleToggle}
        disabled={loading || readOnly}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          milestone.completed
            ? 'bg-emerald-500 border-emerald-500'
            : readOnly
              ? 'border-gray-200 cursor-not-allowed'
              : 'border-gray-300 hover:border-emerald-500'
        }`}
      >
        {milestone.completed && (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${milestone.completed ? 'line-through' : ''}`}
          style={{ color: 'var(--color-text-primary)' }}
        >
          {milestone.title}
        </p>
        {milestone.targetDate && (
          <p
            className="text-xs"
            style={{ color: isOverdue ? '#ef4444' : 'var(--color-text-muted)' }}
          >
            {isOverdue ? 'Vencido: ' : ''}{new Date(milestone.targetDate).toLocaleDateString('es')}
          </p>
        )}
      </div>
    </div>
  )
}
