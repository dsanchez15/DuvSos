'use client'

import { useState, useEffect } from 'react'
import { UserProgression } from '@/types/habit'
import { getLevelName, getXPForNextLevel } from '@/lib/habit-utils'

export default function UserProgressionBadge() {
  const [progression, setProgression] = useState<UserProgression | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/progression')
      .then((res) => res.json())
      .then((data) => {
        setProgression(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !progression) return null

  const levelName = getLevelName(progression.currentLevel)
  const nextLevelXP = getXPForNextLevel(progression.currentLevel)
  const progress = Math.min(100, (progression.totalXP / nextLevelXP) * 100)

  return (
    <div className="progression-badge px-3 py-2 rounded-lg backdrop-blur-sm" style={{ background: 'var(--color-bg-surface-hover)' }}>
      <div className="flex items-center gap-2">
        <div className="level-circle w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-sm font-bold" style={{ color: 'var(--color-text-inverse)' }}>
          {progression.currentLevel}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {levelName}
          </p>
          <div className="xp-track h-1.5 rounded-full overflow-hidden mt-1" style={{ background: 'var(--color-border)' }}>
            <div
              className="xp-fill h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {progression.totalXP} / {nextLevelXP} XP
          </p>
        </div>
      </div>
    </div>
  )
}
