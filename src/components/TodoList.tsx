'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import TodoItem from './TodoItem'
import { formatEffort, getPriorityColor } from '@/lib/todo-utils'

interface SubTask {
  id: number
  title: string
  completed: boolean
  position: number
}

interface Category {
  id: number
  name: string
  color: string
  icon: string
}

interface Todo {
  id: number
  title: string
  description?: string
  completed: boolean
  priority: string
  dueDate?: string
  dueTime?: string
  effortMinutes: number
  position: number
  createdAt: string
  updatedAt: string
  parentId?: number
  categoryId?: number
  category?: Category
  subTasks?: SubTask[]
  progress?: number
  subTasksCount?: number
  completedSubTasksCount?: number
}

interface TodoMetrics {
  total: number
  completed: number
  pending: number
  completionRate: number
  today: { total: number; completed: number; pending: number }
  week: { total: number }
  overdue: number
  totalEffortMinutes: number
}

type ViewMode = 'all' | 'today' | 'week'
type GroupBy = 'none' | 'category' | 'priority' | 'status'
type FilterStatus = '' | 'pending' | 'completed'

interface GroupedTodos {
  [key: string]: Todo[]
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [groupedTodos, setGroupedTodos] = useState<GroupedTodos | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [metrics, setMetrics] = useState<TodoMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState('')
  const [completedCollapsed, setCompletedCollapsed] = useState(false)

  // Form state
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [newTodoDescription, setNewTodoDescription] = useState('')
  const [newTodoPriority, setNewTodoPriority] = useState('normal')
  const [newTodoDueDate, setNewTodoDueDate] = useState('')
  const [newTodoDueTime, setNewTodoDueTime] = useState('')
  const [newTodoEffort, setNewTodoEffort] = useState('')
  const [newTodoCategory, setNewTodoCategory] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Filters
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('')

  // Edit modal
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState('normal')
  const [editDueDate, setEditDueDate] = useState('')
  const [editDueTime, setEditDueTime] = useState('')
  const [editEffort, setEditEffort] = useState('')
  const [editCategory, setEditCategory] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // ─── Optimistic helpers ───
  const recalcParent = (parent: Todo): Todo => {
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (viewMode !== 'all') params.set('view', viewMode)
      if (groupBy !== 'none') params.set('groupBy', groupBy)
      if (debouncedSearch) params.set('search', debouncedSearch)

      const filters = []
      if (filterPriority) filters.push({ field: 'priority', op: 'eq', value: filterPriority })
      if (filterCategory) filters.push({ field: 'category_id', op: 'eq', value: filterCategory })
      if (filterStatus) filters.push({ field: 'status', op: 'eq', value: filterStatus })
      if (filters.length > 0) params.set('filters', JSON.stringify(filters))

      const queryString = params.toString()
      const url = `/api/todos${queryString ? `?${queryString}` : ''}`

      const [todosRes, categoriesRes, metricsRes] = await Promise.all([
        fetch(url),
        fetch('/api/todo-categories'),
        fetch('/api/todos/metrics')
      ])

      if (!todosRes.ok) {
        const err = await todosRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch todos')
      }
      if (!categoriesRes.ok) throw new Error('Failed to fetch categories')

      const todosData = await todosRes.json()
      const categoriesData = await categoriesRes.json()

      if (groupBy !== 'none' && !Array.isArray(todosData)) {
        setGroupedTodos(todosData)
        setTodos([])
      } else {
        setTodos(Array.isArray(todosData) ? todosData : [])
        setGroupedTodos(null)
      }

      setCategories(categoriesData)

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }
    } catch (err: any) {
      setError(err.message || 'Error loading todos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [viewMode, groupBy, debouncedSearch, filterPriority, filterCategory, filterStatus])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  // Keyboard shortcut: "n" to focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim()) return
    setApiError('')

    const effortMinutes = newTodoEffort ? parseFloat(newTodoEffort) * 60 : 0
    const category = categories.find((c) => c.id === (newTodoCategory ? parseInt(newTodoCategory) : undefined))
    const tempId = -Date.now()
    const tempTodo: Todo = {
      id: tempId,
      title: newTodoTitle.trim(),
      description: newTodoDescription || undefined,
      priority: newTodoPriority,
      dueDate: newTodoDueDate || undefined,
      dueTime: newTodoDueTime || undefined,
      effortMinutes: Math.round(effortMinutes),
      categoryId: category?.id,
      category,
      completed: false,
      position: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subTasks: [],
      progress: 0,
      subTasksCount: 0,
      completedSubTasksCount: 0,
    }

    // Optimistic insert
    if (groupedTodos) {
      // In grouped mode we can't easily know the group; just refresh after
    } else {
      setTodos((prev) => [tempTodo, ...prev])
    }

    setNewTodoTitle('')
    setNewTodoDescription('')
    setNewTodoPriority('normal')
    setNewTodoDueDate('')
    setNewTodoDueTime('')
    setNewTodoEffort('')
    setNewTodoCategory('')
    setShowAdvanced(false)

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tempTodo.title,
          description: tempTodo.description,
          priority: tempTodo.priority,
          dueDate: tempTodo.dueDate,
          dueTime: tempTodo.dueTime,
          effortMinutes: tempTodo.effortMinutes,
          categoryId: tempTodo.categoryId,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setApiError(data.error || `Failed to create todo (${response.status})`)
        // Remove temp
        if (!groupedTodos) setTodos((prev) => prev.filter((t) => t.id !== tempId))
        return
      }

      const realTodo: Todo = await response.json()
      if (!groupedTodos) {
        setTodos((prev) => prev.map((t) => (t.id === tempId ? realTodo : t)))
      } else {
        fetchTodos()
      }
      fetch('/api/todos/metrics')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => data && setMetrics(data))
    } catch (err) {
      console.error(err)
      setApiError('Network error. Please try again.')
      if (!groupedTodos) setTodos((prev) => prev.filter((t) => t.id !== tempId))
    }
  }

  const handleCreateSubtask = useCallback(async (parentId: number, title: string) => {
    const tempId = -Date.now()
    const tempSub: SubTask = {
      id: tempId,
      title: title.trim(),
      completed: false,
      position: 0,
    }

    const updateList = (list: Todo[]): Todo[] =>
      list.map((t) => {
        if (t.id === parentId) {
          return recalcParent({
            ...t,
            subTasks: [...(t.subTasks || []), tempSub],
          })
        }
        return t
      })

    if (groupedTodos) {
      const next: GroupedTodos = {}
      for (const [key, list] of Object.entries(groupedTodos)) {
        next[key] = updateList(list)
      }
      setGroupedTodos(next)
    } else {
      setTodos(updateList(todos))
    }

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          parentId,
          priority: 'normal',
        }),
      })
      if (!response.ok) throw new Error('Failed to create subtask')
      const realSub: Todo = await response.json()

      const replaceTemp = (list: Todo[]): Todo[] =>
        list.map((t) => {
          if (t.id === parentId) {
            const nextSubs = (t.subTasks || []).map((s) =>
              s.id === tempId
                ? { id: realSub.id, title: realSub.title, completed: realSub.completed, position: realSub.position }
                : s
            )
            return recalcParent({ ...t, subTasks: nextSubs })
          }
          return t
        })

      if (groupedTodos) {
        const next: GroupedTodos = {}
        for (const [key, list] of Object.entries(groupedTodos)) {
          next[key] = replaceTemp(list)
        }
        setGroupedTodos(next)
      } else {
        setTodos(replaceTemp(todos))
      }
    } catch (err) {
      console.error(err)
      // Remove temp on failure
      const removeTemp = (list: Todo[]): Todo[] =>
        list.map((t) => {
          if (t.id === parentId) {
            return recalcParent({
              ...t,
              subTasks: (t.subTasks || []).filter((s) => s.id !== tempId),
            })
          }
          return t
        })

      if (groupedTodos) {
        const next: GroupedTodos = {}
        for (const [key, list] of Object.entries(groupedTodos)) {
          next[key] = removeTemp(list)
        }
        setGroupedTodos(next)
      } else {
        setTodos(removeTemp(todos))
      }
    }
  }, [groupedTodos, todos])

  const handleToggle = useCallback(async (id: number, completed: boolean) => {
    // Snapshot for revert
    const snapshotTodos = groupedTodos ? null : [...todos]
    const snapshotGrouped = groupedTodos ? { ...groupedTodos, } : null

    // Helper to update a single list
    const updateList = (list: Todo[]): Todo[] => {
      return list.map((t) => {
        // Direct parent match
        if (t.id === id) {
          const nextSubs = completed
            ? (t.subTasks || []).map((s) => ({ ...s, completed: true }))
            : (t.subTasks || []).map((s) => ({ ...s, completed: false }))
          return recalcParent({ ...t, completed, subTasks: nextSubs })
        }
        // Subtask match
        if (t.subTasks?.some((s) => s.id === id)) {
          const nextSubs = t.subTasks.map((s) =>
            s.id === id ? { ...s, completed } : s
          )
          const allDone = nextSubs.every((s) => s.completed)
          const parentCompleted = allDone
          return recalcParent({ ...t, completed: parentCompleted, subTasks: nextSubs })
        }
        return t
      })
    }

    if (groupedTodos) {
      const next: GroupedTodos = {}
      for (const [key, list] of Object.entries(groupedTodos)) {
        next[key] = updateList(list)
      }
      setGroupedTodos(next)
    } else {
      setTodos(updateList(todos))
    }

    try {
      const response = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed }),
      })
      if (!response.ok) throw new Error('Failed to update todo')
      // Sync metrics in background without full reload
      fetch('/api/todos/metrics')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => data && setMetrics(data))
    } catch (err) {
      console.error(err)
      // Revert
      if (snapshotGrouped) setGroupedTodos(snapshotGrouped)
      if (snapshotTodos) setTodos(snapshotTodos)
    }
  }, [groupedTodos, todos])

  const handleDelete = useCallback(async (id: number) => {
    const snapshotTodos = groupedTodos ? null : [...todos]
    const snapshotGrouped = groupedTodos ? { ...groupedTodos } : null

    const removeFromList = (list: Todo[]): Todo[] =>
      list
        .filter((t) => t.id !== id)
        .map((t) => {
          if (t.subTasks?.some((s) => s.id === id)) {
            return recalcParent({
              ...t,
              subTasks: t.subTasks.filter((s) => s.id !== id),
            })
          }
          return t
        })

    if (groupedTodos) {
      const next: GroupedTodos = {}
      for (const [key, list] of Object.entries(groupedTodos)) {
        next[key] = removeFromList(list)
      }
      setGroupedTodos(next)
    } else {
      setTodos(removeFromList(todos))
    }

    try {
      const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete todo')
      fetch('/api/todos/metrics')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => data && setMetrics(data))
    } catch (err) {
      console.error(err)
      if (snapshotGrouped) setGroupedTodos(snapshotGrouped)
      if (snapshotTodos) setTodos(snapshotTodos)
    }
  }, [groupedTodos, todos])

  const openEditModal = useCallback((todo: Todo) => {
    setEditingTodo(todo)
    setEditTitle(todo.title)
    setEditDescription(todo.description || '')
    setEditPriority(todo.priority)
    setEditDueDate(todo.dueDate ? todo.dueDate.split('T')[0] : '')
    setEditDueTime(todo.dueTime || '')
    setEditEffort(todo.effortMinutes ? (todo.effortMinutes / 60).toString() : '')
    setEditCategory(todo.categoryId ? todo.categoryId.toString() : '')
  }, [])

  const handleEditSave = async () => {
    if (!editingTodo) return
    setApiError('')

    const effortMinutes = editEffort ? parseFloat(editEffort) * 60 : 0
    const category = categories.find((c) => c.id === (editCategory ? parseInt(editCategory) : undefined))

    const snapshotTodos = groupedTodos ? null : [...todos]
    const snapshotGrouped = groupedTodos ? { ...groupedTodos } : null

    const applyEdit = (list: Todo[]): Todo[] =>
      list.map((t) => {
        if (t.id === editingTodo.id) {
          return recalcParent({
            ...t,
            title: editTitle.trim(),
            description: editDescription || undefined,
            priority: editPriority,
            dueDate: editDueDate || undefined,
            dueTime: editDueTime || undefined,
            effortMinutes: Math.round(effortMinutes),
            categoryId: category?.id,
            category: category || t.category,
          })
        }
        return t
      })

    if (groupedTodos) {
      const next: GroupedTodos = {}
      for (const [key, list] of Object.entries(groupedTodos)) {
        next[key] = applyEdit(list)
      }
      setGroupedTodos(next)
    } else {
      setTodos(applyEdit(todos))
    }

    try {
      const response = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTodo.id,
          title: editTitle.trim(),
          description: editDescription || undefined,
          priority: editPriority,
          dueDate: editDueDate || undefined,
          dueTime: editDueTime || undefined,
          effortMinutes: Math.round(effortMinutes),
          categoryId: editCategory ? parseInt(editCategory) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setApiError(data.error || `Failed to update todo (${response.status})`)
        if (snapshotGrouped) setGroupedTodos(snapshotGrouped)
        if (snapshotTodos) setTodos(snapshotTodos)
        return
      }

      setEditingTodo(null)
    } catch (err) {
      console.error(err)
      setApiError('Network error. Please try again.')
      if (snapshotGrouped) setGroupedTodos(snapshotGrouped)
      if (snapshotTodos) setTodos(snapshotTodos)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setDebouncedSearch('')
    setFilterPriority('')
    setFilterCategory('')
    setFilterStatus('')
    setViewMode('all')
    setGroupBy('none')
  }

  const hasActiveFilters = searchQuery || filterPriority || filterCategory || filterStatus || viewMode !== 'all' || groupBy !== 'none'

  const renderTodoList = (todoList: Todo[], groupKey?: string) => {
    const unchecked = todoList.filter((t) => !t.completed)
    const checked = todoList.filter((t) => t.completed)

    return (
      <div className="space-y-2">
        {unchecked.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={openEditModal}
            onCreateSubtask={handleCreateSubtask}
          />
        ))}
        {checked.length > 0 && (
          <>
            {unchecked.length > 0 && (
              <button
                onClick={() => setCompletedCollapsed(!completedCollapsed)}
                className="completed-toggle w-full flex items-center gap-2 py-2 text-sm font-medium todo-completed-toggle transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span className="material-symbols-outlined text-sm">
                  {completedCollapsed ? 'expand_more' : 'expand_less'}
                </span>
                Completed ({checked.length})
              </button>
            )}
            {!completedCollapsed && (
              <div className="space-y-2">
                {checked.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={openEditModal}
                    onCreateSubtask={handleCreateSubtask}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  if (loading && todos.length === 0 && !groupedTodos) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
        <button onClick={fetchTodos} className="btn-neon mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Metrics */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>My Todos</h2>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {metrics ? `${metrics.pending} pending · ${metrics.completed} completed · ${metrics.completionRate}% rate` : 'Loading...'}
          </p>
        </div>

        {metrics && (
          <div className="flex gap-3 text-sm flex-wrap">
            <div
              className="todo-metric-card px-3 py-2 rounded-lg"
              style={{ background: 'color-mix(in srgb, var(--color-info) 10%, transparent)' }}
            >
              <span className="metric-value font-bold" style={{ color: 'var(--color-info)' }}>{metrics.today.pending}</span>
              <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>today</span>
            </div>
            <div
              className="todo-metric-card px-3 py-2 rounded-lg"
              style={{ background: 'color-mix(in srgb, var(--color-warning) 10%, transparent)' }}
            >
              <span className="metric-value font-bold" style={{ color: 'var(--color-warning)' }}>{metrics.overdue}</span>
              <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>overdue</span>
            </div>
            <div
              className="todo-metric-card px-3 py-2 rounded-lg"
              style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
            >
              <span className="metric-value font-bold" style={{ color: 'var(--color-primary)' }}>{formatEffort(metrics.totalEffortMinutes)}</span>
              <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>effort</span>
            </div>
          </div>
        )}
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div
          className="todo-error-banner flex items-center gap-3 p-4 border rounded-xl"
          style={{
            background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-danger) 30%, transparent)',
            color: 'var(--color-danger)',
          }}
        >
          <span className="material-symbols-outlined">error</span>
          <span className="flex-1 text-sm font-medium">{apiError}</span>
          <button
            onClick={() => setApiError('')}
            className="todo-error-close p-1 rounded"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* View Mode */}
        <div
          className="todo-view-tabs flex rounded-lg p-1"
          style={{ background: 'var(--color-bg-surface-hover)' }}
        >
          {(['all', 'today', 'week'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              data-active={viewMode === mode}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                viewMode === mode ? 'shadow-sm' : ''
              }`}
              style={{
                background: viewMode === mode ? 'var(--color-bg-surface)' : 'transparent',
                color: viewMode === mode ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Group By */}
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="todo-select px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
        >
          <option value="none">No grouping</option>
          <option value="category">By Category</option>
          <option value="priority">By Priority</option>
          <option value="status">By Status</option>
        </select>

        {/* Search with clear */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-text-muted)' }}>search</span>
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search todos..."
            className="todo-search w-full pl-9 pr-9 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setDebouncedSearch(''); searchRef.current?.focus() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 todo-search-clear"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="todo-select px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="todo-select px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="todo-select px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="todo-clear-filters px-3 py-2 text-sm rounded-lg transition-colors"
            style={{ color: 'var(--color-danger)' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Add Todo Form */}
      <form onSubmit={handleCreateTodo} className="space-y-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Add a new todo... (press N to focus)"
            className="todo-add-input flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
          />
          <button
            type="submit"
            disabled={!newTodoTitle.trim()}
            className="btn-neon px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn-outline px-3 py-3 border rounded-xl todo-advanced-toggle"
            style={{ borderColor: 'var(--color-border)' }}
            title="Advanced options"
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--color-text-secondary)' }}>
              {showAdvanced ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {showAdvanced && (
          <div
            className="todo-advanced-panel grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-xl"
            style={{ background: 'var(--color-bg-surface-hover)' }}
          >
            <input
              type="text"
              value={newTodoDescription}
              onChange={(e) => setNewTodoDescription(e.target.value)}
              placeholder="Description..."
              className="rf-input px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
            />
            <select
              value={newTodoPriority}
              onChange={(e) => setNewTodoPriority(e.target.value)}
              className="todo-select px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input
              type="date"
              value={newTodoDueDate}
              onChange={(e) => setNewTodoDueDate(e.target.value)}
              className="rf-input px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
            />
            <input
              type="time"
              value={newTodoDueTime}
              onChange={(e) => setNewTodoDueTime(e.target.value)}
              className="rf-input px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
            />
            <input
              type="number"
              value={newTodoEffort}
              onChange={(e) => setNewTodoEffort(e.target.value)}
              placeholder="Effort (hours)"
              min="0"
              step="0.5"
              className="rf-input px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
            />
            <select
              value={newTodoCategory}
              onChange={(e) => setNewTodoCategory(e.target.value)}
              className="todo-select sm:col-span-2 lg:col-span-5 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}
      </form>

      {/* Todo List */}
      {groupedTodos ? (
        <div className="space-y-6">
          {Object.entries(groupedTodos).map(([groupName, groupTodos]) => (
            <div key={groupName}>
              <h3
                className="todo-group-header text-lg font-semibold mb-3 flex items-center gap-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <span className="group-dot w-2 h-2 rounded-full bg-primary"></span>
                {groupName}
                <span className="text-sm font-normal" style={{ color: 'var(--color-text-muted)' }}>({groupTodos.length})</span>
              </h3>
              {renderTodoList(groupTodos)}
            </div>
          ))}
        </div>
      ) : todos.length === 0 ? (
        <div
          className="empty-state text-center py-16 rounded-xl border border-dashed"
          style={{ background: 'var(--color-bg-surface-hover)', borderColor: 'var(--color-border)' }}
        >
          <span
            className="material-symbols-outlined text-5xl mb-4 block"
            style={{ color: 'var(--color-text-muted)' }}
          >checklist</span>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>No todos found</p>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>Try adjusting your filters or add a new todo</p>
        </div>
      ) : (
        renderTodoList(todos)
      )}

      {/* Edit Modal */}
      {editingTodo && (
        <div className="delete-modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="todo-edit-modal rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
          >
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Edit Todo</h3>
            <div className="space-y-3">
              <div>
                <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="modal-input w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div>
                <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="modal-input w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="modal-select w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="modal-select w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="modal-input w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Due Time</label>
                  <input
                    type="time"
                    value={editDueTime}
                    onChange={(e) => setEditDueTime(e.target.value)}
                    className="modal-input w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>
              <div>
                <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Effort (hours)</label>
                <input
                  type="number"
                  value={editEffort}
                  onChange={(e) => setEditEffort(e.target.value)}
                  min="0"
                  step="0.5"
                  className="modal-input w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setEditingTodo(null)}
                className="btn-cancel px-4 py-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={!editTitle.trim()}
                className="btn-neon px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
