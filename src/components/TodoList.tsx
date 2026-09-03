'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import TodoItem from '@/components/TodoItem'
import TodoEditModal from '@/components/todo/TodoEditModal'
import TodoDetailsSidebar from '@/components/todo/TodoDetailsSidebar'
import TodoFilters from '@/components/todo/TodoFilters'
import EmptyState from '@/components/ui/EmptyState'
import { useAppTranslation } from '@/components/LanguageProvider'
import { useDebounce } from '@/hooks/useDebounce'
import type { Todo, Category, TodoMetrics, Priority, ViewMode, GroupBy, FilterStatus, GroupedTodos } from '@/types/todo'

function recalcParent(parent: Todo): Todo {
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

export default function TodoList() {
  const { t } = useAppTranslation()
  const [todos, setTodos] = useState<Todo[]>([])
  const [groupedTodos, setGroupedTodos] = useState<GroupedTodos | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [metrics, setMetrics] = useState<TodoMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completedCollapsed, setCompletedCollapsed] = useState(false)

  // Form state
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [newTodoDescription, setNewTodoDescription] = useState('')
  const [newTodoPriority, setNewTodoPriority] = useState<Priority>('normal')
  const [newTodoDueDate, setNewTodoDueDate] = useState('')
  const [newTodoDueTime, setNewTodoDueTime] = useState('')
  const [newTodoEffort, setNewTodoEffort] = useState('')
  const [newTodoCategory, setNewTodoCategory] = useState('')

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('')
  const debouncedSearch = useDebounce(searchQuery, 400)

  // Selected todo for details panel
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)

  // Edit modal
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [editApiError, setEditApiError] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const groupedTodosRef = useRef<GroupedTodos | null>(null)
  const selectedTodoRef = useRef<Todo | null>(null)

  useEffect(() => { groupedTodosRef.current = groupedTodos })
  useEffect(() => { selectedTodoRef.current = selectedTodo })

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
        fetch('/api/todos/metrics'),
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('todos.errors.loadTodos')
      setError(message || t('todos.errors.loadTodos'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [viewMode, groupBy, debouncedSearch, filterPriority, filterCategory, filterStatus, t])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data-fetching pattern
    fetchTodos()
  }, [fetchTodos])

  // Keyboard shortcut: "n" to focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if (editingTodo) return
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingTodo])

  const fetchMetrics = useCallback(async () => {
    const metricsRes = await fetch('/api/todos/metrics')
    if (metricsRes.ok) {
      const metricsData = await metricsRes.json()
      setMetrics(metricsData)
    }
  }, [])

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim()) return

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

    if (!groupedTodos) {
      setTodos((prev) => [tempTodo, ...prev])
    }

    setNewTodoTitle('')
    setNewTodoDescription('')
    setNewTodoPriority('normal')
    setNewTodoDueDate('')
    setNewTodoDueTime('')
    setNewTodoEffort('')
    setNewTodoCategory('')

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
        setError(data.error || `${t('todos.errors.createTodo')} (${response.status})`)
        if (!groupedTodos) setTodos((prev) => prev.filter((item) => item.id !== tempId))
        return
      }

      const realTodo: Todo = await response.json()
      if (!groupedTodos) {
        setTodos((prev) => prev.map((item) => (item.id === tempId ? realTodo : item)))
      } else {
        fetchTodos()
      }
      fetchMetrics()
    } catch (err) {
      console.error(err)
      setError(t('todos.errors.networkError'))
      if (!groupedTodos) setTodos((prev) => prev.filter((item) => item.id !== tempId))
    }
  }

  const handleCreateSubtask = useCallback(async (parentId: number, title: string) => {
    const tempId = -Date.now()

    const updateList = (list: Todo[]): Todo[] =>
      list.map((item) => {
        if (item.id === parentId) {
          return recalcParent({
            ...item,
            subTasks: [...(item.subTasks || []), { id: tempId, title: title.trim(), completed: false, position: 0 }],
          })
        }
        return item
      })

    setGroupedTodos((prev) => {
      if (prev) {
        const next: GroupedTodos = {}
        for (const [key, list] of Object.entries(prev)) {
          next[key] = updateList(list)
        }
        return next
      }
      return null
    })
    setTodos((prev) => updateList(prev))

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), parentId, priority: 'normal' }),
      })
      if (!response.ok) throw new Error(t('todos.errors.createSubtask'))
      const realSub: Todo = await response.json()

      const replaceTemp = (list: Todo[]): Todo[] =>
        list.map((item) => {
          if (item.id === parentId) {
            const nextSubs = (item.subTasks || []).map((s) =>
              s.id === tempId
                ? { id: realSub.id, title: realSub.title, completed: realSub.completed, position: realSub.position }
                : s
            )
            return recalcParent({ ...item, subTasks: nextSubs })
          }
          return item
        })

      setGroupedTodos((prev) => {
        if (prev) {
          const next: GroupedTodos = {}
          for (const [key, list] of Object.entries(prev)) {
            next[key] = replaceTemp(list)
          }
          return next
        }
        return null
      })
      setTodos((prev) => replaceTemp(prev))

      if (selectedTodoRef.current?.id === parentId) {
        const todoRes = await fetch(`/api/todos/${parentId}`)
        if (todoRes.ok) {
          const updated = await todoRes.json()
          setSelectedTodo(updated)
        }
      }
      fetchMetrics()
    } catch (err) {
      console.error(err)
      const removeTemp = (list: Todo[]): Todo[] =>
        list.map((item) => {
          if (item.id === parentId) {
            return recalcParent({
              ...item,
              subTasks: (item.subTasks || []).filter((s) => s.id !== tempId),
            })
          }
          return item
        })

      setGroupedTodos((prev) => {
        if (prev) {
          const next: GroupedTodos = {}
          for (const [key, list] of Object.entries(prev)) {
            next[key] = removeTemp(list)
          }
          return next
        }
        return null
      })
      setTodos((prev) => removeTemp(prev))
    }
  }, [t, fetchMetrics])

  const handleToggle = useCallback(async (id: number, completed: boolean) => {
    const updateList = (list: Todo[]): Todo[] => {
      return list.map((item) => {
        if (item.id === id) {
          const nextSubs = completed
            ? (item.subTasks || []).map((s) => ({ ...s, completed: true }))
            : (item.subTasks || []).map((s) => ({ ...s, completed: false }))
          return recalcParent({ ...item, completed, subTasks: nextSubs })
        }
        if (item.subTasks?.some((s) => s.id === id)) {
          const nextSubs = item.subTasks.map((s) =>
            s.id === id ? { ...s, completed } : s
          )
          const allDone = nextSubs.every((s) => s.completed)
          return recalcParent({ ...item, completed: allDone, subTasks: nextSubs })
        }
        return item
      })
    }

    setGroupedTodos((prev) => {
      if (prev) {
        const next: GroupedTodos = {}
        for (const [key, list] of Object.entries(prev)) {
          next[key] = updateList(list)
        }
        return next
      }
      return null
    })
    setTodos((prev) => updateList(prev))

    if (selectedTodoRef.current?.id === id) {
      setSelectedTodo((prev) => prev ? { ...prev, completed } : prev)
    }

    try {
      const response = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed }),
      })
      if (!response.ok) throw new Error(t('todos.errors.updateTodo'))
      fetchMetrics()
      if (selectedTodoRef.current?.id === id) {
        const todoRes = await fetch(`/api/todos/${id}`)
        if (todoRes.ok) {
          setSelectedTodo(await todoRes.json())
        }
      }
    } catch (err) {
      console.error(err)
      fetchTodos()
    }
  }, [t, fetchMetrics, fetchTodos])

  const handleDelete = useCallback(async (id: number) => {
    const removeFromList = (list: Todo[]): Todo[] =>
      list
        .filter((item) => item.id !== id)
        .map((item) => {
          if (item.subTasks?.some((s) => s.id === id)) {
            return recalcParent({
              ...item,
              subTasks: item.subTasks.filter((s) => s.id !== id),
            })
          }
          return item
        })

    setGroupedTodos((prev) => {
      if (prev) {
        const next: GroupedTodos = {}
        for (const [key, list] of Object.entries(prev)) {
          next[key] = removeFromList(list)
        }
        return next
      }
      return null
    })
    setTodos((prev) => removeFromList(prev))

    if (selectedTodoRef.current?.id === id) {
      setSelectedTodo(null)
    }

    try {
      const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(t('todos.errors.deleteTodo'))
      fetchMetrics()
    } catch (err) {
      console.error(err)
      fetchTodos()
    }
  }, [t, fetchMetrics, fetchTodos])

  const openEditModal = useCallback((todo: Todo) => {
    setEditingTodo(todo)
    setEditApiError('')
  }, [])

  const handleEditSave = useCallback(async (data: {
    id: number
    title: string
    description: string
    priority: Priority
    dueDate: string
    dueTime: string
    effortMinutes: number
    categoryId: number | null
  }) => {
    if (!editingTodo) return

    const editingId = editingTodo.id
    const cat = categories.find((c) => c.id === data.categoryId)

    const applyEdit = (list: Todo[]): Todo[] =>
      list.map((item) => {
        if (item.id === editingId) {
          return recalcParent({
            ...item,
            title: data.title,
            description: data.description || undefined,
            priority: data.priority,
            dueDate: data.dueDate || undefined,
            dueTime: data.dueTime || undefined,
            effortMinutes: data.effortMinutes,
            categoryId: data.categoryId ?? undefined,
            category: cat || item.category,
          })
        }
        return item
      })

    setGroupedTodos((prev) => {
      if (prev) {
        const next: GroupedTodos = {}
        for (const [key, list] of Object.entries(prev)) {
          next[key] = applyEdit(list)
        }
        return next
      }
      return null
    })
    setTodos((prev) => applyEdit(prev))

    try {
      const response = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.id,
          title: data.title,
          description: data.description || undefined,
          priority: data.priority,
          dueDate: data.dueDate || undefined,
          dueTime: data.dueTime || undefined,
          effortMinutes: data.effortMinutes,
          categoryId: data.categoryId,
        }),
      })

      if (!response.ok) {
        const data2 = await response.json().catch(() => ({}))
        setEditApiError(data2.error || `${t('todos.errors.updateTodo')} (${response.status})`)
        return
      }

      if (selectedTodoRef.current?.id === editingId) {
        const updatedTodo = await response.json()
        setSelectedTodo(updatedTodo)
      }

      fetchMetrics()
      setEditingTodo(null)
      setEditApiError('')
    } catch (err) {
      console.error(err)
      setEditApiError(t('todos.errors.networkError'))
    }
  }, [editingTodo, categories, t, fetchMetrics])

  const handleSelectTodo = useCallback((todo: Todo) => {
    setSelectedTodo(todo)
  }, [])

  const clearFilters = () => {
    setSearchQuery('')
    setFilterPriority('')
    setFilterCategory('')
    setFilterStatus('')
    setViewMode('all')
    setGroupBy('none')
  }

  const hasActiveFilters = !!(searchQuery || filterPriority || filterCategory || filterStatus || viewMode !== 'all' || groupBy !== 'none')

  const renderTodoList = (todoList: Todo[], groupKey?: string) => {
    const unchecked = todoList.filter((item) => !item.completed)
    const checked = todoList.filter((item) => item.completed)

    return (
      <div className="space-y-2" role="list" aria-label={groupKey || 'Todo list'}>
        {unchecked.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            isSelected={selectedTodo?.id === todo.id}
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
                aria-expanded={!completedCollapsed}
                aria-controls="completed-todos"
              >
                <span className="material-symbols-outlined text-sm">
                  {completedCollapsed ? 'expand_more' : 'expand_less'}
                </span>
                {t('todos.completedToggle', { count: checked.length })}
              </button>
            )}
            {!completedCollapsed && (
              <div id="completed-todos" className="space-y-2">
                {checked.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    isSelected={selectedTodo?.id === todo.id}
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
        <p className="text-danger">{error}</p>
        <button onClick={fetchTodos} className="btn-neon mt-4 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90">
          {t('todos.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6" role="main">
      {/* Header */}
      <div>
        <h2 className="todo-heading">{t('todos.title')}</h2>
      </div>

      <div className="flex gap-6">
        {/* Main content - 4/5 width */}
        <div
          className="flex-1 min-w-0 space-y-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTodo(null)
          }}
        >
          {/* Add Todo Form */}
          <form onSubmit={handleCreateTodo} className="p-4 rounded-[8px] todo-bg-surface-hover">
            <div className="flex gap-3 items-center">
              <input
                ref={inputRef}
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onFocus={() => setSelectedTodo(null)}
                placeholder={t('todos.addPlaceholder')}
                className="todo-add-input flex-1 todo-input"
                aria-label={t('todos.addPlaceholder')}
              />
              <button
                type="submit"
                disabled={!newTodoTitle.trim()}
                className="btn-neon px-6 py-3 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {t('todos.add')}
              </button>
            </div>
          </form>

          {/* Error Banner */}
          {error && (
            <div
              className="todo-error-banner flex items-center gap-3 p-4 border rounded-[8px]"
              style={{
                background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-danger) 30%, transparent)',
                color: 'var(--color-danger)',
              }}
              role="alert"
            >
              <span className="material-symbols-outlined">error</span>
              <span className="flex-1 text-sm font-medium">{error}</span>
              <button
                onClick={() => setError('')}
                className="todo-error-close p-1 rounded"
                aria-label={t('common.dismiss') || 'Dismiss error'}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          <TodoFilters
            viewMode={viewMode}
            groupBy={groupBy}
            searchQuery={searchQuery}
            filterPriority={filterPriority}
            filterCategory={filterCategory}
            filterStatus={filterStatus}
            categories={categories}
            hasActiveFilters={hasActiveFilters}
            showFilters={showFilters}
            onViewModeChange={setViewMode}
            onGroupByChange={setGroupBy}
            onSearchChange={setSearchQuery}
            onPriorityChange={setFilterPriority}
            onCategoryChange={setFilterCategory}
            onStatusChange={(s) => setFilterStatus(s)}
            onClearFilters={clearFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onClearSearch={() => setSearchQuery('')}
          />

          {/* Todo List */}
          {groupedTodos ? (
            <div className="space-y-6">
              {Object.entries(groupedTodos).map(([groupName, groupTodos]) => (
                <div key={groupName}>
                  <h3
                    className="todo-group-header text-lg font-semibold mb-3 flex items-center gap-2 todo-text-secondary"
                  >
                    <span className="group-dot w-2 h-2 rounded-full bg-primary"></span>
                    {groupName}
                    <span className="text-sm font-normal todo-text-muted">({groupTodos.length})</span>
                  </h3>
                  {renderTodoList(groupTodos, groupName)}
                </div>
              ))}
            </div>
          ) : todos.length === 0 ? (
            <EmptyState
              icon="checklist"
              title={t('todos.noTodos')}
              description={t('todos.adjustFilters')}
            />
          ) : (
            renderTodoList(todos)
          )}

          {/* Edit Modal */}
          {editingTodo && (
            <TodoEditModal
              todo={editingTodo}
              categories={categories}
              onSave={handleEditSave}
              onClose={() => { setEditingTodo(null); setEditApiError('') }}
              apiError={editApiError}
            />
          )}
        </div>

        {/* Sidebar */}
        <TodoDetailsSidebar
          todo={selectedTodo}
          metrics={metrics}
        />
      </div>
    </div>
  )
}