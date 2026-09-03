export const MODULE_COLORS: Record<string, string> = {
  reminder: '#3b82f6',
  habit: '#10b981',
  checklist: '#f59e0b',
  todo: '#ef4444',
  milestone: '#8b5cf6',
}

export interface HabitTracker {
  id: number
  title: string
  color: string
  streak: number
  completedToday: boolean
  goalType: string
  goalValue: number
}

export interface DashboardChecklistItem {
  id: number
  title: string
  completed: boolean
  priority: string
  checklistId: number
  checklistTitle: string
  checklistColor: string
}

export interface DashboardTodo {
  id: number
  title: string
  completed: boolean
  priority: string
  dueDate?: string
  category?: { name?: string; color?: string }
}

export interface UpcomingReminder {
  id: number | string
  title: string
  dueDate: string
  priority: string
  daysUntil: number
  sourceModule?: string
  sourceId?: number
}

export interface DayData {
  count: number
  modules: Record<string, number>
}

export interface WorkloadDay {
  score: number
  overloaded: boolean
}

export interface DashboardMetrics {
  overallStreak: number
  activeProjects: number
  pendingTasks: number
  weeklyCompliance: number
}

export interface NextMilestone {
  id: string
  title: string
  targetDate: string | null
  goal: { id: string; title: string }
}

export interface PerformanceStats {
  gymStreak: number
  hoursThisWeek: number
  hoursThisMonth: number
  totalGoals: number
  completedGoals: number
  nextMilestones: NextMilestone[]
}

export const PRIORITY_ORDER: Record<string, number> = { high: 0, normal: 1, low: 2 }

export function sortByPriority<T extends { priority: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1))
}
