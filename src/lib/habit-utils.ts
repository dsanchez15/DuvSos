import { HabitCompletion, GoalType } from '@/types/habit'
import { t, getLanguage } from '@/lib/i18n'

/**
 * Calculate the current streak for a habit based on its completions
 * A streak is the number of consecutive periods (days/weeks/months)
 * in which the habit goal was met.
 */
export function calculateStreak(
    completions: HabitCompletion[],
    goalType: GoalType = 'Daily',
    goalValue: number = 1
): number {
    if (completions.length === 0) return 0

    const sortedDates = completions
        .map((c) => new Date(c.date))
        .sort((a, b) => b.getTime() - a.getTime())

    const uniqueDates = [...new Set(sortedDates.map((d) => d.toISOString().split('T')[0]))]

    switch (goalType) {
        case 'Daily':
            return calculateDailyStreak(uniqueDates)
        case 'Weekly':
            return calculateWeeklyStreak(uniqueDates, goalValue)
        case 'Monthly':
            return calculateMonthlyStreak(uniqueDates, goalValue)
        default:
            return calculateDailyStreak(uniqueDates)
    }
}

function calculateDailyStreak(uniqueDates: string[]): number {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let streak = 0
    let currentDate = new Date(today)

    // If not completed today, check yesterday
    if (!uniqueDates.includes(today.toISOString().split('T')[0])) {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        if (!uniqueDates.includes(yesterday.toISOString().split('T')[0])) {
            return 0
        }
        currentDate = yesterday
    }

    for (const dateStr of uniqueDates) {
        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0)
        if (date.getTime() === currentDate.getTime()) {
            streak++
            currentDate.setDate(currentDate.getDate() - 1)
        } else if (date < currentDate) {
            break
        }
    }

    return streak
}

function calculateWeeklyStreak(uniqueDates: string[], goalValue: number): number {
    // Group completions by ISO week
    const weekCounts = new Map<string, number>()
    for (const dateStr of uniqueDates) {
        const date = new Date(dateStr)
        const weekKey = getWeekKey(date)
        weekCounts.set(weekKey, (weekCounts.get(weekKey) || 0) + 1)
    }

    const sortedWeeks = Array.from(weekCounts.keys()).sort().reverse()
    let streak = 0
    let currentWeek = getWeekKey(new Date())

    // Check if current week meets goal
    const currentCount = weekCounts.get(currentWeek) || 0
    if (currentCount < goalValue) {
        const prevWeek = getPrevWeekKey(new Date())
        if ((weekCounts.get(prevWeek) || 0) < goalValue) {
            return 0
        }
        currentWeek = prevWeek
    }

    for (const week of sortedWeeks) {
        if (week === currentWeek && (weekCounts.get(week) || 0) >= goalValue) {
            streak++
            currentWeek = getPrevWeekKeyFromKey(currentWeek)
        } else if (week < currentWeek) {
            break
        }
    }

    return streak
}

function calculateMonthlyStreak(uniqueDates: string[], goalValue: number): number {
    const monthCounts = new Map<string, number>()
    for (const dateStr of uniqueDates) {
        const date = new Date(dateStr)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1)
    }

    const sortedMonths = Array.from(monthCounts.keys()).sort().reverse()
    let streak = 0
    const now = new Date()
    let currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const currentCount = monthCounts.get(currentMonth) || 0
    if (currentCount < goalValue) {
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`
        if ((monthCounts.get(prevMonth) || 0) < goalValue) {
            return 0
        }
        currentMonth = prevMonth
    }

    for (const month of sortedMonths) {
        if (month === currentMonth && (monthCounts.get(month) || 0) >= goalValue) {
            streak++
            const [year, monthNum] = currentMonth.split('-').map(Number)
            const prevMonthDate = new Date(year, monthNum - 2, 1)
            currentMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`
        } else if (month < currentMonth) {
            break
        }
    }

    return streak
}

function getWeekKey(date: Date): string {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Monday as start
    return d.toISOString().split('T')[0]
}

function getPrevWeekKey(date: Date): string {
    const d = new Date(date)
    d.setDate(d.getDate() - 7)
    return getWeekKey(d)
}

function getPrevWeekKeyFromKey(weekKey: string): string {
    const d = new Date(weekKey)
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
}

/**
 * Calculate completion rate for the current evaluation period
 */
export function calculateCompletionRate(
    completions: HabitCompletion[],
    goalType: GoalType,
    goalValue: number
): number {
    if (goalValue <= 0) return 0

    const now = new Date()
    let periodCompletions = 0

    switch (goalType) {
        case 'Daily': {
            const today = getLocalDateString(now)
            periodCompletions = completions.filter(
                (c) => getLocalDateString(new Date(c.date)) === today
            ).length
            break
        }
        case 'Weekly': {
            const weekStart = getWeekStart(now)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 7)
            periodCompletions = completions.filter((c) => {
                const d = new Date(c.date)
                return d >= weekStart && d < weekEnd
            }).length
            break
        }
        case 'Monthly': {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
            periodCompletions = completions.filter((c) => {
                const d = new Date(c.date)
                return d >= monthStart && d < monthEnd
            }).length
            break
        }
        case 'Ratio': {
            // For ratio, count all completions within the active cycle or last 30 days
            const thirtyDaysAgo = new Date(now)
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            periodCompletions = completions.filter((c) => new Date(c.date) >= thirtyDaysAgo).length
            // Goal value is the target percentage, not a count
            // We'll interpret this as: need goalValue% of days in period
            const daysInPeriod = 30
            const targetCompletions = Math.ceil((goalValue / 100) * daysInPeriod)
            return Math.min(100, Math.round((periodCompletions / targetCompletions) * 100))
        }
    }

    return Math.min(100, Math.round((periodCompletions / Math.max(1, goalValue)) * 100))
}

/**
 * Get the start of the week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d
}

/**
 * Check if a habit was completed on a specific date
 */
export function isCompletedOnDate(completions: HabitCompletion[], date: string): boolean {
    return completions.some(
        (c) => getLocalDateString(new Date(c.date)) === date
    )
}

/**
 * Count completions for a specific date
 */
export function countCompletionsOnDate(completions: HabitCompletion[], date: string): number {
    return completions.filter(
        (c) => getLocalDateString(new Date(c.date)) === date
    ).length
}

/**
 * Get an array of the last 7 days in YYYY-MM-DD format (local time)
 */
export function getLast7Days(): string[] {
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return getLocalDateString(date)
    }).reverse()
}

/**
 * Get today's date in YYYY-MM-DD format (local time)
 */
export function getTodayDateString(): string {
    return getLocalDateString(new Date())
}

/**
 * Get the current evaluation period text for a goal type
 */
export function getPeriodLabel(goalType: GoalType): string {
    switch (goalType) {
        case 'Daily':
            return t('habits.action.periodLabel.daily')
        case 'Weekly':
            return t('habits.action.periodLabel.weekly')
        case 'Monthly':
            return t('habits.action.periodLabel.monthly')
        case 'Ratio':
            return t('habits.action.periodLabel.ratio')
        default:
            return t('habits.action.periodLabel.ratio')
    }
}

/**
 * Get period range text (e.g., "Monday – Sunday")
 */
export function getPeriodRangeText(goalType: GoalType): string {
    const now = new Date()
    const locale = getLanguage() === 'es' ? 'es-ES' : 'en-US'
    switch (goalType) {
        case 'Weekly': {
            const start = getWeekStart(now)
            const end = new Date(start)
            end.setDate(end.getDate() + 6)
            const fmt = (d: Date) => d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric' })
            return `${fmt(start)} – ${fmt(end)}`
        }
        case 'Monthly': {
            const start = new Date(now.getFullYear(), now.getMonth(), 1)
            const fmt = (d: Date) => d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
            return fmt(start)
        }
        default:
            return ''
    }
}

/**
 * Helper to get YYYY-MM-DD string from a Date object in local time
 */
function getLocalDateString(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Validate if a string is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color)
}

/**
 * Validate habit cycle dates
 */
export function validateCycle(
    isPermanent: boolean,
    startDate?: string | null,
    endDate?: string | null
): { valid: boolean; error?: string } {
    if (isPermanent) {
        return { valid: true }
    }

    if (!startDate || !endDate) {
        return { valid: false, error: t('habits.form.cycleDatesRequired') }
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) {
        return { valid: false, error: t('habits.form.cycleEndDateAfterStart') }
    }

    return { valid: true }
}

/**
 * XP and Level utilities
 */
export function calculateLevel(totalXP: number): number {
    // Simple exponential level curve
    // Level 1: 0 XP
    // Level 2: 100 XP
    // Level 3: 250 XP
    // Level 4: 450 XP
    // Level 5: 700 XP
    // etc.
    let level = 1
    let threshold = 0
    let increment = 100

    while (totalXP >= threshold + increment) {
        threshold += increment
        increment += 50
        level++
    }

    return level
}

export function getXPForNextLevel(currentLevel: number): number {
    let threshold = 0
    let increment = 100
    for (let i = 1; i < currentLevel; i++) {
        threshold += increment
        increment += 50
    }
    return threshold + increment
}

export function getLevelName(level: number): string {
    if (level <= 3) return t('habits.levels.beginner')
    if (level <= 6) return t('habits.levels.aspirant')
    if (level <= 10) return t('habits.levels.competent')
    if (level <= 15) return t('habits.levels.expert')
    return t('habits.levels.master')
}

export function getXPForHabitCompletion(goalType: GoalType): number {
    switch (goalType) {
        case 'Daily':
            return 10
        case 'Weekly':
            return 15
        case 'Monthly':
            return 25
        case 'Ratio':
            return 20
        default:
            return 10
    }
}

export function checkMilestones(totalCompletions: number): string | null {
    const milestones = [10, 30, 50, 100, 250, 500, 1000]
    if (milestones.includes(totalCompletions)) {
        return t('habits.milestones.congrats', { count: totalCompletions })
    }
    return null
}
