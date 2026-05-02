'use client'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export default function StatCard({ label, value, sublabel, icon, trend }: StatCardProps) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ background: 'var(--color-bg-input)' }}>
      <div className="flex items-center justify-center mb-2">
        {icon}
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </p>
      <p className="text-xs uppercase mt-1" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      {sublabel && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {sublabel}
        </p>
      )}
    </div>
  )
}
