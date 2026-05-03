'use client'

import { Goal } from '@/types/goal'
import ProgressRing from './ProgressRing'
import PriorityBadge from './PriorityBadge'

interface GoalCardProps {
  goal: Goal
  onClick?: () => void
}

export default function GoalCard({ goal, onClick }: GoalCardProps) {
  const progress = goal.estimatedHours && goal.estimatedHours > 0
    ? Math.min(100, (goal.totalHoursSpent / goal.estimatedHours) * 100)
    : null

  return (
    <div
      onClick={onClick}
      className="dashboard-card rounded-xl p-5 border-l-4 cursor-pointer transition-all hover:shadow-md"
      style={{
        background: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border)',
        borderLeftColor: goal.category === 'PROFESIONAL' ? '#3b82f6' : '#10b981'
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {goal.title}
            </h3>
            <span
              className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: goal.category === 'PROFESIONAL' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', color: goal.category === 'PROFESIONAL' ? '#3b82f6' : '#10b981' }}
            >
              {goal.category === 'PROFESIONAL' ? 'Profesional' : 'Personal'}
            </span>
          </div>
          {goal.description && (
            <p className="text-sm mt-1 truncate" style={{ color: 'var(--color-text-muted)' }}>
              {goal.description}
            </p>
          )}
        </div>
        <PriorityBadge priority={goal.priority} />
      </div>

      {progress !== null && (
        <div className="flex items-center gap-3 mb-3">
          <ProgressRing progress={progress} size={40} />
          <div className="flex-1">
            <div className="w-full rounded-full h-2" style={{ background: 'var(--color-bg-input)' }}>
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {goal.totalHoursSpent.toFixed(1)} / {goal.estimatedHours}h
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {goal.deadline && (
          <span>Vence: {new Date(goal.deadline).toLocaleDateString('es')}</span>
        )}
        {goal.milestones && goal.milestones.length > 0 && (
          <span>{goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} hitos</span>
        )}
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          goal.status === 'ACTIVE' ? 'badge-active' :
          goal.status === 'COMPLETED' ? 'badge-completed' :
          goal.status === 'PAUSED' ? 'badge-paused' :
          goal.status === 'PENDING' ? 'badge-pending' : ''
        }`}
          style={
            goal.status === 'ACTIVE' ? { background: 'rgba(16,185,129,0.1)', color: '#10b981' } :
            goal.status === 'COMPLETED' ? { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' } :
            goal.status === 'PAUSED' ? { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' } :
            goal.status === 'PENDING' ? { background: 'rgba(107,114,128,0.1)', color: '#6b7280' } :
            { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
          }
        >
          {goal.status === 'ACTIVE' ? 'Activo' :
           goal.status === 'COMPLETED' ? 'Completado' :
           goal.status === 'PAUSED' ? 'Pausado' :
           goal.status === 'PENDING' ? 'Pendiente' : 'Cancelado'}
        </span>
      </div>
    </div>
  )
}
