'use client'

import { useState } from 'react'

interface EnergySelectorProps {
  onLog?: (level: number) => void
}

export default function EnergySelector({ onLog }: EnergySelectorProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const levels = [
    { value: 1, label: 'Muy baja', emoji: '😫', color: 'bg-red-500' },
    { value: 2, label: 'Baja', emoji: '😕', color: 'bg-orange-500' },
    { value: 3, label: 'Media', emoji: '😐', color: 'bg-yellow-500' },
    { value: 4, label: 'Alta', emoji: '🙂', color: 'bg-lime-500' },
    { value: 5, label: 'Muy alta', emoji: '🤩', color: 'bg-green-500' },
  ]

  const handleSelect = async (level: number) => {
    setSelected(level)
    try {
      const response = await fetch('/api/user/energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      })
      if (response.ok) {
        setSubmitted(true)
        onLog?.(level)
      }
    } catch (err) {
      console.error('Error logging energy:', err)
    }
  }

  if (submitted) {
    return (
      <div className="energy-selector dashboard-card rounded-xl p-4 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
        <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
          Nivel de energía registrado: {levels.find((l) => l.value === selected)?.emoji} {levels.find((l) => l.value === selected)?.label}
        </p>
      </div>
    )
  }

  return (
    <div className="energy-selector dashboard-card rounded-xl p-4 border" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>¿Cómo te sientes hoy?</h4>
      <div className="flex justify-between gap-1">
        {levels.map((level) => (
          <button
            key={level.value}
            onClick={() => handleSelect(level.value)}
            className={`energy-btn flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
              selected === level.value
                ? 'energy-btn-selected ring-2 ring-primary'
                : 'energy-btn-idle'
            }`}
            style={selected === level.value ? { background: 'var(--color-bg-surface-hover)' } : {}}
          >
            <span className="text-2xl">{level.emoji}</span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{level.label}</span>
            <div className={`w-full h-1 rounded-full ${level.color} opacity-50`} />
          </button>
        ))}
      </div>
    </div>
  )
}
