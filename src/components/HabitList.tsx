'use client'

import { useState, useEffect, useCallback } from 'react'
import HabitCard from './HabitCard'
import HabitForm from './HabitForm'
import { Habit, HabitFormData } from '@/types/habit'
import { getTodayDateString, isCompletedOnDate } from '@/lib/habit-utils'

export default function HabitList() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const fetchHabits = useCallback(async () => {
    try {
      const response = await fetch('/api/habits')
      if (!response.ok) throw new Error('Failed to fetch habits')
      const data = await response.json()
      setHabits(data)
    } catch (err) {
      setError('Error al cargar los hábitos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const handleCreateHabit = async (data: HabitFormData) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create habit')
      const newHabit = await response.json()
      setHabits([newHabit, ...habits])
      setShowForm(false)
    } catch (err) {
      console.error(err)
      alert('Error al crear el hábito')
    }
  }

  const handleUpdateHabit = async (id: string, data: HabitFormData) => {
    try {
      const response = await fetch(`/api/habits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update habit')
      const updatedHabit = await response.json()
      setHabits(habits.map((h) => (h.id === id ? updatedHabit : h)))
    } catch (err) {
      console.error(err)
      alert('Error al actualizar el hábito')
    }
  }

  const handleDeleteHabit = async (id: string) => {
    try {
      const response = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete habit')
      setHabits(habits.filter((h) => h.id !== id))
    } catch (err) {
      console.error(err)
      alert('Error al eliminar el hábito')
    }
  }

  const handleToggleCompletion = async (id: string, date: string, completed: boolean) => {
    try {
      if (completed) {
        const response = await fetch(`/api/habits/${id}/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date }),
        })
        if (!response.ok) throw new Error('Failed to create completion')
        const newCompletion = await response.json()
        setHabits(
          habits.map((h) =>
            h.id === id
              ? { ...h, completions: [...h.completions, newCompletion] }
              : h
          )
        )
      } else {
        const response = await fetch(`/api/habits/${id}/completions?date=${date}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to delete completion')
        setHabits(
          habits.map((h) =>
            h.id === id
              ? {
                ...h,
                completions: h.completions.filter(
                  (c) => new Date(c.date).toISOString().split('T')[0] !== date
                ),
              }
              : h
          )
        )
      }
    } catch (err) {
      console.error(err)
      alert('Error al actualizar la completación')
    }
  }

  const totalCompletionsToday = habits.filter((h) =>
    isCompletedOnDate(h.completions, getTodayDateString())
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchHabits}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mis Hábitos</h2>
          <p className="text-gray-600 mt-1">
            {habits.length === 0
              ? 'No tienes hábitos registrados'
              : `${habits.length} hábito${habits.length !== 1 ? 's' : ''} · ${totalCompletionsToday} completado${totalCompletionsToday !== 1 ? 's' : ''} hoy`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {showForm ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancelar</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo Hábito</span>
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear Nuevo Hábito</h3>
          <HabitForm onSubmit={handleCreateHabit} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {habits.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-gray-500 text-lg">Aún no tienes hábitos</p>
          <p className="text-gray-400 mt-1">Haz clic en &quot;Nuevo Hábito&quot; para comenzar</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onUpdate={handleUpdateHabit}
              onDelete={handleDeleteHabit}
              onToggleCompletion={handleToggleCompletion}
            />
          ))}
        </div>
      )}
    </div>
  )
}
