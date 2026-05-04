'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import GoalCard from '@/components/GoalCard'
import { Goal } from '@/types/goal'
import { useAppTranslation } from '@/components/LanguageProvider'

export default function GoalsPage() {
  const { t } = useAppTranslation()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (!showInactive) {
        params.set('status', 'ACTIVE,PENDING')
      }
      if (categoryFilter) params.set('category', categoryFilter)

      const res = await fetch(`/api/goals?${params}`)
      if (!res.ok) throw new Error(t('goals.errors.fetchGoals'))

      const data = await res.json()
      setGoals(data.goals)
      setError('')
    } catch (err) {
      setError(t('goals.errors.fetchGoals'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [showInactive, categoryFilter])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const deleteGoal = async (goalId: string) => {
    if (!confirm(t('goals.confirmDelete'))) return
    try {
      const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
      if (res.ok) {
        setGoals(goals.filter(g => g.id !== goalId))
      } else {
        alert(t('goals.errors.deleteGoal'))
      }
    } catch (err) {
      console.error(err)
      alert(t('goals.errors.deleteGoal'))
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {t('goals.title')}
            </h1>
            <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {t('goals.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/goals/phases"
              className="px-4 py-2 border rounded-lg font-medium hover:bg-primary/5 transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              {t('goals.phases')}
            </a>
            <a
              href="/goals/new"
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              + {t('goals.newGoal')}
            </a>
          </div>
        </header>

        <div className="flex gap-4 items-center flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {t('goals.showInactive')}
            </span>
          </label>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border"
            style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="">{t('goals.allCategories')}</option>
            <option value="PROFESIONAL">{t('goals.categoryProfessional')}</option>
            <option value="PERSONAL">{t('goals.categoryPersonal')}</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
            {t('common.loading')}
          </p>
        ) : error ? (
          <p className="text-center py-8 text-red-500">{error}</p>
        ) : goals.length === 0 ? (
          <div className="text-center py-12 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
            <p className="text-lg mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {t('goals.noGoals')}
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              {showInactive ? t('goals.noGoals') : t('goals.createFirst')}
            </p>
            <a
              href="/goals/new"
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors inline-block"
            >
              {t('goals.newGoal')}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => (
              <div key={goal.id} className="relative">
                <GoalCard
                  goal={goal}
                  onClick={() => window.location.href = `/goals/${goal.id}`}
                />
                {(goal.status === 'PAUSED' || goal.status === 'CANCELLED') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteGoal(goal.id)
                    }}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                    title={t('goals.actions.deleteGoal')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
