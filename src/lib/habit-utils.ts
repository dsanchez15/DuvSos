import { Completion } from '@/types/habit'

/**
 * Calculate the current streak for a habit based on its completions
 * A streak is the number of consecutive days the habit has been completed
 */
export function calculateStreak(completions: Completion[]): number {
    if (completions.length === 0) return 0

    const sortedDates = completions
        .map((c) => new Date(c.date))
        .sort((a, b) => b.getTime() - a.getTime())

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let streak = 0
    let currentDate = new Date(today)

    const uniqueDates = [...new Set(sortedDates.map((d) => d.toISOString().split('T')[0]))]

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
        if (date.getTime() === currentDate.getTime()) {
            streak++
            currentDate.setDate(currentDate.getDate() - 1)
        } else if (date < currentDate) {
            break
        }
    }

    return streak
}

/**
 * Check if a habit was completed on a specific date
 */
export function isCompletedOnDate(completions: Completion[], date: string): boolean {
    return completions.some(
        (c) => getLocalDateString(new Date(c.date)) === date
    )
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
