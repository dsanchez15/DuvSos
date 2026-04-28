'use client'

import { useState, useEffect } from 'react'
import { HabitFormData, Category, Objective, HabitState, GoalType } from '@/types/habit'

interface HabitFormProps {
  onSubmit: (data: HabitFormData) => void
  onCancel?: () => void
  initialData?: Partial<HabitFormData>
  categories?: Category[]
  objectives?: Objective[]
}

const colors = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Amarillo', value: '#eab308' },
  { name: 'Morado', value: '#a855f7' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Naranja', value: '#f97316' },
  { name: 'Cyan', value: '#06b6d4' },
]

const goalTypes: { value: GoalType; label: string }[] = [
  { value: 'Daily', label: 'Diario' },
  { value: 'Weekly', label: 'Semanal' },
  { value: 'Monthly', label: 'Mensual' },
  { value: 'Ratio', label: 'Ratio (%)' },
]

export default function HabitForm({ onSubmit, onCancel, initialData, categories = [], objectives = [] }: HabitFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [color, setColor] = useState(initialData?.color || '#3b82f6')
  const [state, setState] = useState<HabitState>(initialData?.state || 'Active')
  const [isPermanent, setIsPermanent] = useState(initialData?.isPermanent !== false)
  const [startDate, setStartDate] = useState(initialData?.startDate || '')
  const [endDate, setEndDate] = useState(initialData?.endDate || '')
  const [goalType, setGoalType] = useState<GoalType>(initialData?.goalType || 'Daily')
  const [goalValue, setGoalValue] = useState(initialData?.goalValue || 1)
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '')
  const [objectiveId, setObjectiveId] = useState(initialData?.objectiveId || '')
  const [cycleError, setCycleError] = useState('')

  useEffect(() => {
    if (!isPermanent) {
      if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        setCycleError('La fecha de fin debe ser posterior o igual a la de inicio')
      } else {
        setCycleError('')
      }
    } else {
      setCycleError('')
    }
  }, [isPermanent, startDate, endDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (cycleError) return

    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      color,
      state,
      isPermanent,
      startDate: isPermanent ? null : startDate || null,
      endDate: isPermanent ? null : endDate || null,
      goalType,
      goalValue: parseInt(String(goalValue), 10) || 1,
      categoryId: categoryId ? parseInt(String(categoryId), 10) : null,
      objectiveId: objectiveId ? parseInt(String(objectiveId), 10) : null,
    })

    if (!initialData) {
      setTitle('')
      setDescription('')
      setColor('#3b82f6')
      setState('Active')
      setIsPermanent(true)
      setStartDate('')
      setEndDate('')
      setGoalType('Daily')
      setGoalValue(1)
      setCategoryId('')
      setObjectiveId('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="title" className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Título del hábito *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rf-input w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
            placeholder="Ej: Ejercicio diario"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rf-input w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
            rows={2}
            placeholder="Ej: 30 minutos de ejercicio"
          />
        </div>

        <div>
          <label className="rf-label block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Color</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-8 h-8 rounded-full transition-all ${color === c.value
                    ? 'ring-2 ring-offset-2 scale-110'
                    : 'hover:scale-105'
                  }`}
                style={{
                  backgroundColor: c.value,
                  ...(color === c.value ? { '--tw-ring-color': 'var(--color-border-strong)', '--tw-ring-offset-color': 'var(--color-bg-surface)' } as React.CSSProperties : {})
                }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Estado</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value as HabitState)}
            className="rf-select w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
          >
            <option value="Active">Activo</option>
            <option value="Paused">Pausado</option>
            <option value="Archived">Archivado</option>
          </select>
        </div>

        <div>
          <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Categoría</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rf-select w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
          >
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Objetivo</label>
          <select
            value={objectiveId}
            onChange={(e) => setObjectiveId(e.target.value)}
            className="rf-select w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
          >
            <option value="">Sin objetivo</option>
            {objectives.map((obj) => (
              <option key={obj.id} value={obj.id}>{obj.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="rf-label flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            <input
              type="checkbox"
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              className="w-4 h-4 text-primary rounded focus:ring-primary"
            />
            Hábito permanente (sin fecha de fin)
          </label>
        </div>

        {!isPermanent && (
          <>
            <div>
              <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Fecha de inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rf-input w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
              />
            </div>
            <div>
              <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Fecha de fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rf-input w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
              />
            </div>
            {cycleError && (
              <div className="md:col-span-2 text-sm" style={{ color: 'var(--color-danger)' }}>{cycleError}</div>
            )}
          </>
        )}

        <div>
          <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Tipo de meta</label>
          <select
            value={goalType}
            onChange={(e) => setGoalType(e.target.value as GoalType)}
            className="rf-select w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
          >
            {goalTypes.map((gt) => (
              <option key={gt.value} value={gt.value}>{gt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Valor de meta {goalType === 'Ratio' ? '(%)' : '(veces)'}
          </label>
          <input
            type="number"
            min={1}
            max={goalType === 'Ratio' ? 100 : 999}
            value={goalValue}
            onChange={(e) => setGoalValue(parseInt(e.target.value) || 1)}
            className="rf-input w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 btn-neon rounded-lg hover:bg-primary/90 transition-colors font-medium"
          style={{ background: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
        >
          {initialData ? 'Actualizar' : 'Crear Hábito'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 btn-outline rounded-lg habit-cancel-btn transition-colors font-medium"
            style={{ background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-secondary)' }}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
