'use client'

type Priority = 'ALTA' | 'MEDIA' | 'BAJA'

interface PriorityBadgeProps {
  priority: Priority
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = {
    ALTA: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Alta' },
    MEDIA: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Media' },
    BAJA: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Baja' },
  }

  const { bg, color, label } = config[priority] || config.MEDIA

  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  )
}
