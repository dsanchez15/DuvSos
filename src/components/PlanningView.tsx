'use client'

import { useState } from 'react'
import HabitCard from './HabitCard'
import HabitForm from './HabitForm'
import { useAppTranslation } from '@/components/LanguageProvider'
import { Habit, Category, Objective, HabitFormData, HabitState } from '@/types/habit'

interface PlanningViewProps {
  habits: Habit[]
  categories: Category[]
  objectives: Objective[]
  onCreate: (data: HabitFormData) => Promise<void>
  onUpdate: (id: number, data: HabitFormData) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onStateChange: (id: number, state: HabitState) => Promise<void>
  loading?: boolean
}

export default function PlanningView({
  habits,
  categories,
  objectives,
  onCreate,
  onUpdate,
  onDelete,
  onStateChange,
  loading,
}: PlanningViewProps) {
  const { t } = useAppTranslation()
  const [filter, setFilter] = useState<HabitState | 'All'>('All')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const filteredHabits = filter === 'All'
    ? habits
    : habits.filter((h) => h.state === filter)

  const handleUpdate = async (id: number, data: HabitFormData) => {
    await onUpdate(id, data)
    setEditingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('habits.planning.title')}</h2>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('habits.planning.habitCount', { count: habits.length })}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2 btn-neon bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          {showForm ? t('habits.planning.cancel') : t('habits.planning.newHabit')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['All', 'Active', 'Paused', 'Archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`habit-filter-btn px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'habit-filter-btn-active bg-primary text-white'
                : 'planning-filter-inactive'
            }`}
            style={filter !== f ? { background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)' } : undefined}
          >
            {f === 'All' ? t('habits.planning.filters.all') : f === 'Active' ? t('habits.planning.filters.active') : f === 'Paused' ? t('habits.planning.filters.paused') : t('habits.planning.filters.archived')}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="habit-form-container rounded-xl p-6 border" style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>{t('habits.planning.createHabit')}</h3>
          <HabitForm
            onSubmit={async (data) => { await onCreate(data); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
            categories={categories}
            objectives={objectives}
          />
        </div>
      )}

      {filteredHabits.length === 0 ? (
        <div className="empty-state text-center py-16 rounded-xl border border-dashed" style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)' }}>
          <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>{t('habits.planning.noHabits')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredHabits.map((habit) => (
            <div key={habit.id}>
              {editingId === habit.id ? (
                <div className="dashboard-card rounded-xl shadow-md p-6 border-l-4" style={{ background: 'var(--color-bg-surface)', borderLeftColor: habit.color }}>
                  <HabitForm
                    initialData={habit}
                    onSubmit={(data) => handleUpdate(habit.id, data)}
                    onCancel={() => setEditingId(null)}
                    categories={categories}
                    objectives={objectives}
                  />
                </div>
              ) : (
                <HabitCard
                  habit={habit}
                  onUpdate={(id, data) => handleUpdate(id, data)}
                  onDelete={onDelete}
                  onStateChange={onStateChange}
                  onEdit={() => setEditingId(habit.id)}
                  mode="planning"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
