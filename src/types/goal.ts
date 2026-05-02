export type GoalCategory = 'PROFESIONAL' | 'PERSONAL'
export type Priority = 'ALTA' | 'MEDIA' | 'BAJA'
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'

export interface GoalMilestone {
  id: string
  goalId: string
  title: string
  targetDate?: string | Date | null
  completed: boolean
  completedAt?: string | Date | null
  order: number
}

// Alias for backward compatibility within the feature
export type Milestone = GoalMilestone

export interface Goal {
  id: string
  userId: number
  category: GoalCategory
  title: string
  description?: string | null
  priority: Priority
  status: GoalStatus
  deadline?: string | Date | null
  estimatedHours?: number | null
  totalHoursSpent: number
  milestones?: Milestone[]
  createdAt: string | Date
  updatedAt: string | Date
  completedAt?: string | Date | null
}

export interface Phase {
  id: string
  userId: number
  number: number
  title: string
  description?: string | null
  startDate?: string | Date | null
  endDate?: string | Date | null
  createdAt: string | Date
}

export interface DailyProgress {
  id: string
  userId: number
  date: string | Date
  goalId?: string | null
  gymCompleted: boolean
  sleepHours?: number | null
  studyHours?: number | null
  workHours?: number | null
  notes?: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

export interface WeeklyCheckIn {
  id: string
  userId: number
  weekStartDate: string | Date
  fatigueLevel: number
  completedHours?: number | null
  deviations?: string | null
  adjustmentNotes?: string | null
  createdAt: string | Date
}

export interface GoalStats {
  gymStreak: number
  hoursThisWeek: number
  hoursThisMonth: number
  totalGoals: number
  completedGoals: number
  nextMilestones: (Milestone & { goal: { id: string; title: string } })[]
}
