'use client'

import { useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { useAppTranslation } from '@/components/LanguageProvider'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import HabitGrid from '@/components/dashboard/HabitGrid'
import PerformanceSection from '@/components/dashboard/PerformanceSection'
import WeeklyCompliance from '@/components/dashboard/WeeklyCompliance'
import TaskLists from '@/components/dashboard/TaskLists'
import QuickRegisterForm from '@/components/dashboard/QuickRegisterForm'
import DashboardCalendar from '@/components/dashboard/DashboardCalendar'
import Scorecard from '@/components/dashboard/Scorecard'
import UpcomingReminders from '@/components/dashboard/UpcomingReminders'

export default function DashboardPage() {
  const { t } = useAppTranslation()
  const { flags } = useFeatureFlags()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const {
    habits,
    checklists,
    todos,
    upcomingReminders,
    calendarData,
    workloadData,
    metrics,
    performanceStats,
    fetchPerformanceStats,
    markHabitDone,
    markTodoDone,
    markChecklistItemDone,
    markReminderDone,
  } = useDashboardData({ year, month, flags })

  const goToday = () => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDate(now)
  }

  const goPrev = () => {
    const d = new Date(currentDate)
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  const goNext = () => {
    const d = new Date(currentDate)
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  const selectedDateStr = selectedDate.toISOString().split('T')[0]
  const selectedWorkload = workloadData[selectedDateStr]
  const isOverloaded = selectedWorkload?.overloaded ?? false

  return (
    <AppLayout>
      <div className="space-y-6">
        <DashboardHeader
          viewMode={viewMode}
          currentDate={currentDate}
          onViewModeChange={setViewMode}
          onToday={goToday}
          onPrev={goPrev}
          onNext={goNext}
        />

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* ═══ MAIN CONTENT ═══ */}
          <main className="flex-1 space-y-8">
            {/* Overload Warning */}
            {isOverloaded && (
              <div
                className="flex items-start gap-3 rounded-[8px] border p-4"
                style={{
                  background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--color-danger) 30%, transparent)',
                }}
              >
                <span className="material-symbols-outlined text-danger">warning</span>
                <div>
                  <p className="text-sm font-medium text-danger">{t('dashboard.overloadWarning.title')}</p>
                  <p className="mt-0.5 text-xs text-danger/80">
                    {t('dashboard.overloadWarning.message', { count: selectedWorkload.score })}
                  </p>
                </div>
              </div>
            )}

            {flags.habits && (
              <div>
                <HabitGrid habits={habits} onMarkDone={markHabitDone} />
                <WeeklyCompliance metrics={metrics} />
              </div>
            )}

            {flags.goals && <PerformanceSection stats={performanceStats} />}

            <TaskLists
              checklists={checklists}
              todos={todos}
              showChecklists={flags.checklists}
              onMarkChecklistItemDone={markChecklistItemDone}
              onMarkTodoDone={markTodoDone}
            />

            {flags.checkin && <QuickRegisterForm onRegistered={fetchPerformanceStats} />}

            <DashboardCalendar
              year={year}
              month={month}
              calendarData={calendarData}
              workloadData={workloadData}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </main>

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <aside className="w-full space-y-6 lg:w-80">
            <Scorecard metrics={metrics} />
            {flags.reminders && (
              <UpcomingReminders reminders={upcomingReminders} onMarkDone={markReminderDone} />
            )}
          </aside>
        </div>
      </div>
    </AppLayout>
  )
}
