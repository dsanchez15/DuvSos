'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Modal, Select, Textarea } from '@/components/ui'
import { apiClient } from '@/lib/api-client'
import { useAppTranslation } from '@/components/LanguageProvider'
import RecurrenceFields, { type RecurrenceValue } from './RecurrenceFields'
import ExceptionsManager, { type ExceptionEntry } from './ExceptionsManager'
import BlockersManager, { type BlockerEntry } from './BlockersManager'
import type { Reminder, ReminderPriority } from '@/types/reminder'

interface ReminderFormModalProps {
  reminder: Reminder | null
  onSaved: () => void
  onClose: () => void
}

interface ReminderDetail {
  recurrenceRule?: {
    frequency: string
    interval: number
    daysOfWeek?: number[]
    dayOfMonth?: number | null
    monthOfYear?: number | null
    endDate?: string | null
  } | null
  exceptions: { exceptionDate: string; reason?: string | null }[]
  blockers: { blockerModule: string; blockerId: number }[]
}

const INITIAL_RECURRENCE: RecurrenceValue = {
  frequency: 'once',
  interval: 1,
  daysOfWeek: [],
  dayOfMonth: '',
  monthOfYear: '',
  endDate: '',
}

function toDateInput(d?: string | Date | null): string {
  return d ? new Date(d).toISOString().split('T')[0] : ''
}

export default function ReminderFormModal({ reminder, onSaved, onClose }: ReminderFormModalProps) {
  const { t } = useAppTranslation()
  const editing = reminder !== null

  const [title, setTitle] = useState(reminder?.title ?? '')
  const [description, setDescription] = useState(reminder?.description ?? '')
  const [dueDate, setDueDate] = useState(toDateInput(reminder?.dueDate))
  const [priority, setPriority] = useState<ReminderPriority>((reminder?.priority as ReminderPriority) ?? 'normal')
  const [sourceModule, setSourceModule] = useState(reminder?.sourceModule ?? '')
  const [sourceId, setSourceId] = useState(reminder?.sourceId?.toString() ?? '')
  const [lifecycleStart, setLifecycleStart] = useState(toDateInput(reminder?.lifecycleStartDate))
  const [lifecycleEnd, setLifecycleEnd] = useState(toDateInput(reminder?.lifecycleEndDate))
  const [recurrence, setRecurrence] = useState<RecurrenceValue>(INITIAL_RECURRENCE)
  const [exceptions, setExceptions] = useState<ExceptionEntry[]>([])
  const [blockers, setBlockers] = useState<BlockerEntry[]>([])
  const [conflictWarning, setConflictWarning] = useState<{ date: string; conflicts: { title: string; module: string }[] } | null>(null)
  const [saving, setSaving] = useState(false)

  // Load full detail (recurrence/exceptions/blockers) when editing
  useEffect(() => {
    if (!reminder) return
    apiClient
      .get<ReminderDetail>(`/api/reminders/${reminder.id}/detail`)
      .then((detail) => {
        if (detail.recurrenceRule) {
          setRecurrence({
            frequency: detail.recurrenceRule.frequency as RecurrenceValue['frequency'],
            interval: detail.recurrenceRule.interval,
            daysOfWeek: detail.recurrenceRule.daysOfWeek || [],
            dayOfMonth: detail.recurrenceRule.dayOfMonth?.toString() || '',
            monthOfYear: detail.recurrenceRule.monthOfYear?.toString() || '',
            endDate: detail.recurrenceRule.endDate ? toDateInput(detail.recurrenceRule.endDate) : '',
          })
        }
        setExceptions(
          detail.exceptions.map((e) => ({ date: toDateInput(e.exceptionDate), reason: e.reason || '' }))
        )
        setBlockers(
          detail.blockers.map((b) => ({ blockerModule: b.blockerModule, blockerId: b.blockerId.toString() }))
        )
      })
      .catch(() => {})
  }, [reminder])

  const checkConflicts = async () => {
    if (!dueDate) return
    try {
      const data = await apiClient.post<{ hasConflict: boolean; date: string; conflicts: { title: string; module: string }[] }>(
        '/api/reminders/conflict-check',
        { date: dueDate }
      )
      setConflictWarning(data.hasConflict ? data : null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !dueDate) return
    setSaving(true)

    const data = {
      title: title.trim(),
      description: description.trim() || null,
      dueDate,
      priority,
      sourceModule: sourceModule || null,
      sourceId: sourceId ? parseInt(sourceId) : null,
      lifecycleStartDate: lifecycleStart || null,
      lifecycleEndDate: lifecycleEnd || null,
      recurrence:
        recurrence.frequency !== 'once'
          ? {
              frequency: recurrence.frequency,
              interval: recurrence.interval,
              daysOfWeek: recurrence.daysOfWeek,
              dayOfMonth: recurrence.dayOfMonth ? parseInt(recurrence.dayOfMonth) : null,
              monthOfYear: recurrence.monthOfYear ? parseInt(recurrence.monthOfYear) : null,
              startDate: dueDate,
              endDate: recurrence.endDate || null,
            }
          : undefined,
      blockers: blockers.map((b) => ({ blockerModule: b.blockerModule, blockerId: parseInt(b.blockerId) })),
    }

    try {
      if (editing) {
        await apiClient.put(`/api/reminders/${reminder.id}`, data)
        for (const exc of exceptions) {
          await apiClient.post(`/api/reminders/${reminder.id}/exceptions`, {
            exceptionDate: exc.date,
            reason: exc.reason,
          })
        }
      } else {
        await apiClient.post('/api/reminders', data)
      }
      onSaved()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={editing ? t('reminders.form.editTitle') : t('reminders.form.newTitle')}
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Basic */}
        <Input
          label={t('reminders.form.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
        <Textarea
          label={t('reminders.form.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="resize-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('reminders.form.dueDate')}
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value)
              setConflictWarning(null)
            }}
            onBlur={checkConflicts}
            required
          />
          <Select
            label={t('reminders.form.priority')}
            value={priority}
            onChange={(e) => setPriority(e.target.value as ReminderPriority)}
          >
            <option value="low">{t('reminders.form.low')}</option>
            <option value="normal">{t('reminders.form.normal')}</option>
            <option value="high">{t('reminders.form.high')}</option>
          </Select>
        </div>

        {/* Conflict warning */}
        {conflictWarning && (
          <div
            className="rounded-[8px] border p-3"
            style={{
              background: 'color-mix(in srgb, var(--color-warning) 8%, transparent)',
              borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-warning">warning</span>
              <span className="text-sm font-medium text-warning">
                {t('reminders.form.conflictsOn', { count: conflictWarning.conflicts.length, date: conflictWarning.date })}
              </span>
            </div>
            <ul className="ml-6 mt-1 list-disc text-xs text-warning/80">
              {conflictWarning.conflicts.slice(0, 3).map((c, i) => (
                <li key={i}>
                  {c.title} ({c.module})
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Source Linking */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t('reminders.form.sourceModule')}
            value={sourceModule}
            onChange={(e) => setSourceModule(e.target.value)}
          >
            <option value="">{t('reminders.form.moduleNone')}</option>
            <option value="habit">{t('reminders.form.moduleHabit')}</option>
            <option value="checklist">{t('reminders.form.moduleChecklist')}</option>
            <option value="todo">{t('reminders.form.moduleTodo')}</option>
            <option value="milestone">{t('reminders.form.moduleMilestone')}</option>
          </Select>
          <Input
            label={t('reminders.form.sourceId')}
            type="number"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
          />
        </div>

        {/* Lifecycle */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('reminders.form.lifecycleStart')}
            type="date"
            value={lifecycleStart}
            onChange={(e) => setLifecycleStart(e.target.value)}
          />
          <Input
            label={t('reminders.form.lifecycleEnd')}
            type="date"
            value={lifecycleEnd}
            onChange={(e) => setLifecycleEnd(e.target.value)}
          />
        </div>

        {/* Recurrence */}
        <RecurrenceFields value={recurrence} onChange={setRecurrence} />

        {/* Exceptions */}
        <ExceptionsManager exceptions={exceptions} onChange={setExceptions} />

        {/* Blockers */}
        <BlockersManager blockers={blockers} onChange={setBlockers} />

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose} className="border border-border">
            {t('common.cancel')}
          </Button>
          <Button type="submit" fullWidth disabled={!title.trim() || !dueDate || saving}>
            {editing ? t('common.save') : t('common.create')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
