'use client'

import { useState } from 'react'
import HabitForm from './HabitForm'
import { Habit, HabitFormData } from '@/types/habit'
import { calculateStreak, getTodayDateString, getLast7Days, isCompletedOnDate } from '@/lib/habit-utils'

interface HabitCardProps {
  habit: Habit
  onUpdate: (id: string, data: HabitFormData) => void
  onDelete: (id: string) => void
  onToggleCompletion: (id: string, date: string, completed: boolean) => void
}

export default function HabitCard({
  habit,
  onUpdate,
  onDelete,
  onToggleCompletion,
}: HabitCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const today = getTodayDateString()
  const isCompletedToday = isCompletedOnDate(habit.completions, today)
  const last7Days = getLast7Days()
  const streak = calculateStreak(habit.completions)

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderLeftColor: habit.color }}>
        <HabitForm
          initialData={habit}
          onSubmit={(data) => {
            onUpdate(habit.id, data)
            setIsEditing(false)
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 transition-all hover:shadow-lg" style={{ borderLeftColor: habit.color }}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800">{habit.title}</h3>
          {habit.description && (
            <p className="text-sm text-gray-500 mt-1">{habit.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => onToggleCompletion(habit.id, today, !isCompletedToday)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isCompletedToday
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          {isCompletedToday ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Completado hoy</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Marcar como hecho</span>
            </>
          )}
        </button>

        {streak > 0 && (
          <div className="flex items-center gap-1 text-orange-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879.586.585.88 1.2.879 1.879 0 1.5-1.12 2.99-2.76 2.99-1.339 0-2.4-.78-2.87-1.75M7 17v2h6v-2H7z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{streak} días</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-2">Últimos 7 días:</span>
        {last7Days.map((date) => {
          const isCompleted = isCompletedOnDate(habit.completions, date)
          const dayName = new Date(date).toLocaleDateString('es', { weekday: 'narrow' })
          return (
            <div
              key={date}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${isCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-400'
                }`}
              title={new Date(date).toLocaleDateString('es')}
            >
              {dayName}
            </div>
          )
        })}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h4 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar hábito?</h4>
            <p className="text-gray-600 mb-4">
              Esta acción no se puede deshacer. Se eliminará el hábito &quot;{habit.title}&quot; y todo su historial.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDelete(habit.id)
                  setShowDeleteConfirm(false)
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
