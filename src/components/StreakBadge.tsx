'use client'

interface StreakBadgeProps {
  streak: number
  label?: string
}

export default function StreakBadge({ streak, label = 'días' }: StreakBadgeProps) {
  if (streak === 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'var(--color-bg-input)' }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 1c1 1 3 2.5 4 5.5M9.5 12c.5-3.5 3-5.5 5-5.5 2.5 0 4.5 2 4.5 5.5 0 4-3.5 7.5-7.5 7.5-2.5 0-4.5-1.5-4.5-4.5 0-2 .5-3.5 2-4.5z" />
        </svg>
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Sin racha
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10">
      <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879.586.585.88 1.2.879 1.879 0 1.5-1.12 2.99-2.76 2.99-1.339 0-2.4-.78-2.87-1.75M7 17v2h6v-2H7z" clipRule="evenodd" />
      </svg>
      <span className="text-sm font-bold text-orange-500">
        {streak}
      </span>
      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
    </div>
  )
}
