'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import TodoItem from './TodoItem'
import { useAppTranslation } from '@/components/LanguageProvider'
import { formatEffort, formatDate, isOverdue } from '@/lib/todo-utils'

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
  const { t } = useAppTranslation()
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
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('')

  // Selected todo for details panel
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)

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
        throw new Error(err.error || t('todos.errors.fetchTodos'))
      }
      if (!categoriesRes.ok) throw new Error(t('todos.errors.fetchCategories'))

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
      setError(err.message || t('todos.errors.loadTodos'))
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
        setApiError(data.error || `${t('todos.errors.createTodo')} (${response.status})`)
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
      const metricsRes = await fetch('/api/todos/metrics')
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }
    } catch (err) {
      console.error(err)
      setApiError(t('todos.errors.networkError'))
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
      if (!response.ok) throw new Error(t('todos.errors.createSubtask'))
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

      // Update selectedTodo if subtask was added to it
      if (selectedTodo?.id === parentId) {
        const todoRes = await fetch(`/api/todos/${parentId}`)
        if (todoRes.ok) {
          const updatedTodo = await todoRes.json()
          setSelectedTodo(updatedTodo)
        }
      }

      // Update metrics
      const metricsRes = await fetch('/api/todos/metrics')
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
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
  }, [groupedTodos, todos, selectedTodo])

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

    // Update selectedTodo if it was toggled
    if (selectedTodo?.id === id) {
      setSelectedTodo((prev) => prev ? { ...prev, completed } : prev)
    }

    try {
      const response = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed }),
      })
      if (!response.ok) throw new Error(t('todos.errors.updateTodo'))
      // Sync metrics and refresh selected todo data
      const metricsRes = await fetch('/api/todos/metrics')
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }
      if (selectedTodo?.id === id) {
        const todoRes = await fetch(`/api/todos/${id}`)
        if (todoRes.ok) {
          const updatedTodo = await todoRes.json()
          setSelectedTodo(updatedTodo)
        }
      }
    } catch (err) {
      console.error(err)
      // Revert
      if (snapshotGrouped) setGroupedTodos(snapshotGrouped)
      if (snapshotTodos) setTodos(snapshotTodos)
    }
  }, [groupedTodos, todos, selectedTodo])

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

    // Clear selectedTodo if it was deleted
    if (selectedTodo?.id === id) {
      setSelectedTodo(null)
    }

    try {
      const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(t('todos.errors.deleteTodo'))
      const metricsRes = await fetch('/api/todos/metrics')
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }
    } catch (err) {
      console.error(err)
      if (snapshotGrouped) setGroupedTodos(snapshotGrouped)
      if (snapshotTodos) setTodos(snapshotTodos)
    }
  }, [groupedTodos, todos, selectedTodo])

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

  const handleSelectTodo = useCallback((todo: Todo) => {
    setSelectedTodo(todo)
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
        setApiError(data.error || `${t('todos.errors.updateTodo')} (${response.status})`)
        if (snapshotGrouped) setGroupedTodos(snapshotGrouped)
        if (snapshotTodos) setTodos(snapshotTodos)
        return
      }

      // Update selectedTodo if it was edited
      if (selectedTodo?.id === editingTodo.id) {
        const updatedTodo = await response.json()
        setSelectedTodo(updatedTodo)
      }

      // Update metrics
      const metricsRes = await fetch('/api/todos/metrics')
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }

      setEditingTodo(null)
    } catch (err) {
      console.error(err)
      setApiError(t('todos.errors.networkError'))
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
            selectedTodo={selectedTodo}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={openEditModal}
            onSelect={handleSelectTodo}
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
                {t('todos.completedToggle', { count: checked.length })}
              </button>
            )}
            {!completedCollapsed && (
              <div className="space-y-2">
                {checked.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    selectedTodo={selectedTodo}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={openEditModal}
                    onSelect={handleSelectTodo}
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
        <button onClick={fetchTodos} className="btn-neon mt-4 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90">
          {t('todos.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('todos.title')}</h2>
      </div>

      <div className="flex gap-6">
        {/* Main content - 4/5 width */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Add Todo Form */}
          <form onSubmit={handleCreateTodo} className="p-4 rounded-[16px]" style={{ background: 'var(--color-bg-surface-hover)' }}>
            <div className="flex gap-3 items-center">
              <input
                ref={inputRef}
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                placeholder={t('todos.addPlaceholder')}
                className="todo-add-input flex-1 px-4 py-3 rounded-[12px] border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
              />
              <button
                type="submit"
                disabled={!newTodoTitle.trim()}
                className="btn-neon px-6 py-3 bg-primary text-white rounded-[12px] hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {t('todos.add')}
              </button>
            </div>
          </form>

          {/* API Error Banner */}
      {apiError && (
        <div
          className="todo-error-banner flex items-center gap-3 p-4 border rounded-[8px]"
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

      {/* Filters Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm font-medium transition-colors"
        style={{ 
          background: 'var(--color-bg-surface-hover)',
          color: 'var(--color-text-secondary)',
          borderColor: 'var(--color-border)'
        }}
      >
        <span className="material-symbols-outlined text-sm">filter_list</span>
        {t('common.filter')}
        {(hasActiveFilters) && (
          <span 
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--color-primary)' }}
          />
        )}
      </button>

      {/* Filters Bar */}
      {showFilters && (
      <div className="flex flex-wrap gap-2 items-center">
        {/* View Mode */}
        <div
          className="todo-view-tabs flex rounded-[8px] p-1"
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
              {t(`todos.viewTabs.${mode}`)}
            </button>
          ))}
        </div>

        {/* Group By */}
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="todo-select px-3 py-2 rounded-[8px] border text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
        >
          <option value="none">{t('todos.groupBy.none')}</option>
          <option value="category">{t('todos.groupBy.category')}</option>
          <option value="priority">{t('todos.groupBy.priority')}</option>
          <option value="status">{t('todos.groupBy.status')}</option>
        </select>

        {/* Search with clear */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-text-muted)' }}>search</span>
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('todos.searchPlaceholder')}
            className="todo-search w-full pl-9 pr-9 py-2 rounded-[8px] border text-sm"
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
          className="todo-select px-3 py-2 rounded-[8px] border text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
        >
          <option value="">{t('todos.priorities.all')}</option>
          <option value="high">{t('todos.priorities.high')}</option>
          <option value="normal">{t('todos.priorities.normal')}</option>
          <option value="low">{t('todos.priorities.low')}</option>
        </select>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="todo-select px-3 py-2 rounded-[8px] border text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
        >
          <option value="">{t('common.all')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="todo-select px-3 py-2 rounded-[8px] border text-sm"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
        >
          <option value="">{t('todos.statuses.all')}</option>
          <option value="pending">{t('todos.statuses.pending')}</option>
          <option value="completed">{t('todos.statuses.completed')}</option>
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="todo-clear-filters px-3 py-2 text-sm rounded-[8px] transition-colors"
            style={{ color: 'var(--color-danger)' }}
          >
            {t('todos.clearFilters')}
          </button>
        )}
      </div>
      )}

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
          className="empty-state text-center py-16 rounded-[8px] border border-dashed"
          style={{ background: 'var(--color-bg-surface-hover)', borderColor: 'var(--color-border)' }}
        >
          <span
            className="material-symbols-outlined text-5xl mb-4 block"
            style={{ color: 'var(--color-text-muted)' }}
          >checklist</span>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>{t('todos.noTodos')}</p>
            <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('todos.adjustFilters')}</p>
        </div>
      ) : (
        renderTodoList(todos)
      )}

      {/* Edit Modal */}
      {editingTodo && (
        <div className="delete-modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="todo-edit-modal rounded-[8px] p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
          >
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('todos.editTitle')}</h3>
            <div className="space-y-3">
              <div>
                <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('todos.form.title')}</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="modal-input w-full px-4 py-2 rounded-[8px] border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div>
                <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('todos.form.description')}</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="modal-input w-full px-4 py-2 rounded-[8px] border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('todos.form.priority')}</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="modal-select w-full px-3 py-2 rounded-[8px] border"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('todos.form.category')}</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="modal-select w-full px-3 py-2 rounded-[8px] border"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                  >
              <option value="">{t('todos.noCategory')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('todos.form.dueDate')}</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="modal-input w-full px-3 py-2 rounded-[8px] border"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('todos.form.dueTime')}</label>
                  <input
                    type="time"
                    value={editDueTime}
                    onChange={(e) => setEditDueTime(e.target.value)}
                    className="modal-input w-full px-3 py-2 rounded-[8px] border"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>
              <div>
                <label className="rf-label block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('todos.form.effort')}</label>
                <input
                  type="number"
                  value={editEffort}
                  onChange={(e) => setEditEffort(e.target.value)}
                  min="0"
                  step="0.5"
                  className="modal-input w-full px-3 py-2 rounded-[8px] border"
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
                {t('common.cancel')}
              </button>
              <button
                onClick={handleEditSave}
                disabled={!editTitle.trim()}
                className="btn-neon px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0">
          <div className="sticky top-6 flex flex-col gap-4">
            {/* Todo Details Card */}
            <div
              className="rounded-[8px] p-5 border"
              style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
            >
              <h3 className="text-xl font-bold mb-5" style={{ color: 'var(--color-text-primary)' }}>
                {t('todos.details.title')}
              </h3>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                {/* Category */}
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {t('todos.details.category')}
                  </p>
                  {selectedTodo?.category ? (
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {selectedTodo.category.name}
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {t('todos.details.none')}
                    </p>
                  )}
                </div>
                {/* Status */}
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {t('todos.details.status')}
                  </p>
                  {selectedTodo ? (
                    <p
                      className="text-sm font-medium"
                      style={{ color: selectedTodo.completed ? 'var(--color-success)' : 'var(--color-info)' }}
                    >
                      {selectedTodo.completed ? t('todos.statuses.completed') : t('todos.statuses.pending')}
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {t('todos.details.none')}
                    </p>
                  )}
                </div>
                {/* Priority */}
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {t('todos.details.priority')}
                  </p>
                  {selectedTodo?.priority ? (
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {t(`todos.priorities.${selectedTodo.priority}`)}
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {t('todos.details.none')}
                    </p>
                  )}
                </div>
                {/* Date */}
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {t('todos.details.date')}
                  </p>
                  {selectedTodo?.dueDate ? (
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {formatDate(selectedTodo.dueDate)}
                      {selectedTodo.dueTime && ` ${selectedTodo.dueTime}`}
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {t('todos.details.none')}
                    </p>
                  )}
                </div>
                {/* Effort */}
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {t('todos.details.effort')}
                  </p>
                  {selectedTodo && selectedTodo.effortMinutes > 0 ? (
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {formatEffort(selectedTodo.effortMinutes)}
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {t('todos.details.none')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[1px]"></div>

            {/* Statistics Card */}
            <div
              className="rounded-[8px] p-5 border"
              style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
            >
              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {t('todos.statistics.title')}
              </h3>
              <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
                {t('todos.statistics.subtitle')}
              </p>
              {metrics && (
                <div className="space-y-5">
                  {/* All Tasks */}
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('todos.statistics.allTasks')}</span>
                    <span className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{metrics.total}</span>
                  </div>

                  {/* Pending */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-info)' }}></span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{t('todos.statuses.pending')}</span>
                    </div>
                    <span className="text-lg font-semibold" style={{ color: 'var(--color-info)' }}>{metrics.pending}</span>
                  </div>

                  {/* Completed */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-success)' }}></span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{t('todos.statuses.completed')}</span>
                    </div>
                    <span className="text-lg font-semibold" style={{ color: 'var(--color-success)' }}>{metrics.completed}</span>
                  </div>

                  {/* Overdue */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-danger)' }}></span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{t('todos.overdue')}</span>
                    </div>
                    <span className="text-lg font-semibold" style={{ color: 'var(--color-danger)' }}>{metrics.overdue}</span>
                  </div>

                  {/* Bottom boxes: Effort & Compliance */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div
                      className="rounded-[8px] p-3"
                      style={{ background: 'var(--color-bg-surface-hover)' }}
                    >
                      <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('todos.statistics.effort')}</p>
                      <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {formatEffort(metrics.totalEffortMinutes)}
                      </p>
                    </div>
                    <div
                      className="rounded-[8px] p-3"
                      style={{ background: 'var(--color-bg-surface-hover)' }}
                    >
                      <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('todos.statistics.compliance')}</p>
                      <p className="text-xl font-bold" style={{ color: 'var(--color-danger)' }}>
                        {metrics.completionRate}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
