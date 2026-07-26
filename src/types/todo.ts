export type Priority = 'low' | 'normal' | 'high'

export interface TodoCategory {
  id: number
  name: string
  color: string
  icon: string
}

export interface SubTask {
  id: number
  title: string
  completed: boolean
  position: number
}

export interface Todo {
  id: number
  title: string
  description?: string
  completed: boolean
  priority: Priority
  dueDate?: string
  dueTime?: string
  effortMinutes: number
  position: number
  createdAt: string
  updatedAt: string
  parentId?: number
  categoryId?: number
  category?: TodoCategory
  subTasks?: SubTask[]
  progress?: number
  subTasksCount?: number
  completedSubTasksCount?: number
}

export interface TodoMetrics {
  total: number
  completed: number
  pending: number
  completionRate: number
  today: { total: number; completed: number; pending: number }
  week: { total: number }
  overdue: number
  totalEffortMinutes: number
}

export type ViewMode = 'all' | 'today' | 'week'
export type GroupBy = 'none' | 'category' | 'priority' | 'status'
export type FilterStatus = '' | 'pending' | 'completed'

export interface GroupedTodos {
  [key: string]: Todo[]
}
