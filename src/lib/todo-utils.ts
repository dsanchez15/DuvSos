/**
 * Format minutes into human-readable effort string
 */
export function formatEffort(minutes: number): string {
  if (minutes === 0) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
}

/**
 * Get Tailwind color classes for priority badge (background + text)
 * Aure palette: Rocket Orange for high, Galaxy Violet for normal, Comet Tail Violet for low
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'bg-rocket-orange text-deep-space'
    case 'normal': return 'bg-galaxy-violet text-deep-space'
    case 'low': return 'bg-ghostly-grey text-deep-space'
    default: return 'bg-nebula-gray text-stardust-white'
  }
}

/**
 * Extract YYYY-MM-DD in LOCAL timezone from any date string.
 * This is critical because ISO strings store UTC time, but we want
 * the calendar date as seen by the user.
 */
function extractDatePart(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format a date string into relative display (Today, Tomorrow, or date)
 * Accepts ISO strings or YYYY-MM-DD
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return ''

  const datePart = extractDatePart(dateStr)
  const [year, month, day] = datePart.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (date.getTime() === today.getTime()) return 'Today'

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Check if a todo is overdue
 * Accepts ISO strings or YYYY-MM-DD
 */
export function isOverdue(dueDate?: string, completed?: boolean): boolean {
  if (!dueDate || completed) return false
  const datePart = extractDatePart(dueDate)
  const [year, month, day] = datePart.split('-').map(Number)
  const due = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

/**
 * Check if a date string is in the past (before today)
 */
export function isDateInPast(dateStr?: string): boolean {
  if (!dateStr) return false
  const datePart = extractDatePart(dateStr)
  const [year, month, day] = datePart.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

/**
 * Calculate progress percentage from subtasks
 */
export function calculateProgress(subTasks: { completed: boolean }[]): number {
  if (subTasks.length === 0) return 0
  const completed = subTasks.filter((st) => st.completed).length
  return Math.round((completed / subTasks.length) * 100)
}

/**
 * Recalculate a parent todo's progress and subtask counters.
 * Returns a new todo object with updated progress, subTasksCount and
 * completedSubTasksCount derived from its subTasks.
 */
export function recalcTodoParent<T extends {
  completed: boolean
  subTasks?: { id: number; title: string; completed: boolean; position: number }[]
  progress?: number
  subTasksCount?: number
  completedSubTasksCount?: number
}>(parent: T): T {
  const subs = parent.subTasks || []
  const completedSubtasks = subs.filter((s) => s.completed).length
  const totalSubtasks = subs.length
  const progress = totalSubtasks > 0
    ? Math.round((completedSubtasks / totalSubtasks) * 100)
    : (parent.completed ? 100 : 0)
  return {
    ...parent,
    subTasks: subs,
    progress,
    subTasksCount: totalSubtasks,
    completedSubTasksCount: completedSubtasks,
  }
}
