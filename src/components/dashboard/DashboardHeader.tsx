'use client'

import { useAppTranslation } from '@/components/LanguageProvider'

interface DashboardHeaderProps {
  viewMode: 'month' | 'week'
  currentDate: Date
  onViewModeChange: (mode: 'month' | 'week') => void
  onToday: () => void
  onPrev: () => void
  onNext: () => void
}

export default function DashboardHeader({
  viewMode,
  currentDate,
  onViewModeChange,
  onToday,
  onPrev,
  onNext,
}: DashboardHeaderProps) {
  const { t, language } = useAppTranslation()

  const tabStyle = (active: boolean): React.CSSProperties =>
    active
      ? { background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-sm)' }
      : { color: 'var(--color-text-muted)' }

  return (
    <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('dashboard.title')}</h1>
        <p className="mt-1 text-text-secondary">{t('dashboard.subtitle')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-bg-input p-1">
          <button onClick={() => onViewModeChange('month')} className="rounded-md px-3 py-1.5 text-sm font-medium" style={tabStyle(viewMode === 'month')}>
            {t('dashboard.month')}
          </button>
          <button onClick={() => onViewModeChange('week')} className="rounded-md px-3 py-1.5 text-sm font-medium" style={tabStyle(viewMode === 'week')}>
            {t('dashboard.week')}
          </button>
        </div>
        <button onClick={onToday} className="rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10">
          {t('dashboard.today')}
        </button>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="dashboard-nav-btn rounded-lg p-2" aria-label="Previous">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <span className="min-w-[120px] text-center text-sm font-medium text-text-primary">
            {currentDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={onNext} className="dashboard-nav-btn rounded-lg p-2" aria-label="Next">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </header>
  )
}
