'use client'

import { useState } from 'react'
import { Button, Input, Select } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'

export interface BlockerEntry {
  blockerModule: string
  blockerId: string
}

interface BlockersManagerProps {
  blockers: BlockerEntry[]
  onChange: (blockers: BlockerEntry[]) => void
}

export default function BlockersManager({ blockers, onChange }: BlockersManagerProps) {
  const { t } = useAppTranslation()
  const [newModule, setNewModule] = useState('')
  const [newId, setNewId] = useState('')

  const addBlocker = () => {
    if (!newModule || !newId) return
    onChange([...blockers, { blockerModule: newModule, blockerId: newId }])
    setNewModule('')
    setNewId('')
  }

  const removeBlocker = (idx: number) => {
    onChange(blockers.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-text-secondary">
        {t('reminders.form.blockers')}
      </label>
      <div className="mb-2 flex gap-2">
        <Select
          fieldSize="sm"
          value={newModule}
          onChange={(e) => setNewModule(e.target.value)}
          aria-label={t('reminders.form.module')}
          className="w-auto"
        >
          <option value="">{t('reminders.form.module')}</option>
          <option value="habit">{t('reminders.form.moduleHabit')}</option>
          <option value="checklist">{t('reminders.form.moduleChecklist')}</option>
          <option value="todo">{t('reminders.form.moduleTodo')}</option>
          <option value="reminder">{t('reminders.form.moduleMilestone')}</option>
        </Select>
        <Input
          fieldSize="sm"
          type="number"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
          placeholder={t('reminders.form.id')}
        />
        <Button variant="secondary" size="sm" onClick={addBlocker} className="shrink-0">
          {t('reminders.form.add')}
        </Button>
      </div>
      {blockers.length > 0 && (
        <div className="space-y-1">
          {blockers.map((b, i) => (
            <div key={i} className="flex items-center justify-between rounded-[8px] bg-bg-input px-3 py-1.5 text-sm">
              <span className="capitalize text-text-secondary">
                {b.blockerModule} #{b.blockerId}
              </span>
              <button
                type="button"
                onClick={() => removeBlocker(i)}
                className="reminder-remove-btn text-text-muted"
                aria-label={t('common.delete')}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
